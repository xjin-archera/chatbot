import copy

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.types import Command, interrupt

from agent.state import DEFAULT_GUIDE_STEPS, CourseBuilderInput, CourseBuilderState
from agent.tools import (
    add_lesson,
    add_module,
    create_course,
    get_course,
    get_courses,
    publish_course,
    update_course,
)

MUTATION_TOOLS = ["create_course", "update_course", "add_module", "add_lesson", "publish_course"]
READ_TOOLS = ["get_courses", "get_course"]

read_tools = [get_courses, get_course]
mutation_tools = [create_course, update_course, add_module, add_lesson, publish_course]
all_tools = read_tools + mutation_tools

tool_map = {t.name: t for t in all_tools}

llm = ChatAnthropic(model_name="claude-sonnet-4-20250514", stop=None, temperature=0, timeout=300)
llm_with_tools = llm.bind_tools(all_tools)


# --- Nodes ---

def guide(state: CourseBuilderState) -> dict:
    guide_steps = state.get("guide_steps") or []

    if not guide_steps:
        # First run: initialize from defaults, activate first step
        steps = copy.deepcopy(DEFAULT_GUIDE_STEPS)
        steps[0]["status"] = "active"
        return {
            "guide_steps": steps,
            "current_step_id": steps[0]["id"],
        }

    # Only advance if execute node signaled completion
    if not state.get("step_completed"):
        return {}

    # Mark current step completed, activate next
    steps = copy.deepcopy(guide_steps)
    current_step_id = state.get("current_step_id", "")

    for step in steps:
        if step["id"] == current_step_id:
            step["status"] = "completed"
            break

    next_step = next((s for s in steps if s["status"] == "pending"), None)
    if next_step:
        next_step["status"] = "active"
        return {
            "guide_steps": steps,
            "current_step_id": next_step["id"],
            "step_completed": False,
        }

    # All steps completed
    return {"guide_steps": steps, "step_completed": False}


async def agent(state: CourseBuilderState) -> dict:
    guide_steps = state.get("guide_steps") or []
    current_step_id = state.get("current_step_id", "")

    steps_text = "\n".join(
        f"- [{s['status'].upper()}] {s['title']}: {s['description']}"
        for s in guide_steps
    )
    current_step = next((s for s in guide_steps if s["id"] == current_step_id), None)
    current_step_text = current_step["title"] if current_step else "unknown"

    system = SystemMessage(content=f"""You are a course builder assistant guiding the user through creating a course step by step.

Current guide steps:
{steps_text}

The current active step is: {current_step_text}

Focus on helping the user complete the current step. Ask for any information you need.
You can call get_courses or get_course anytime to check the current state.
When you have enough information to take action, call the appropriate tool \
(create_course, update_course, add_module, add_lesson, publish_course) with the proposed data. \
Your mutation tool calls will be shown to the user for confirmation before being executed.""")

    messages = [system, *state["messages"]]
    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}


def should_continue(state: CourseBuilderState) -> str:
    last = state["messages"][-1]
    if not isinstance(last, AIMessage) or not last.tool_calls:
        return "end"
    if any(tc["name"] in MUTATION_TOOLS for tc in last.tool_calls):
        return "confirm"
    return "continue"


def confirm(state: CourseBuilderState) -> Command:
    last = state["messages"][-1]
    assert isinstance(last, AIMessage)
    mutation_calls = [tc for tc in last.tool_calls if tc["name"] in MUTATION_TOOLS]

    payload = {
        "type": "confirmation",
        "proposed_actions": [
            {"tool": tc["name"], "args": tc["args"]}
            for tc in mutation_calls
        ],
    }

    response = interrupt(payload)

    decision = response.get("action", "reject")

    if decision == "approve":
        return Command(goto="execute")

    if decision == "edit":
        edited_args = response.get("args", {})
        return Command(goto="execute", update={"edited_args": edited_args})

    # reject: cancel the tool calls and go back to agent
    cancel_messages = [
        ToolMessage(content="Action cancelled by user.", tool_call_id=tc["id"])
        for tc in mutation_calls
    ]
    return Command(goto="agent", update={"messages": cancel_messages})


async def execute(state: CourseBuilderState) -> dict:
    # Find the last AIMessage that proposed mutation tool calls
    last_ai = next(
        (
            msg
            for msg in reversed(state["messages"])
            if isinstance(msg, AIMessage)
            and any(tc["name"] in MUTATION_TOOLS for tc in (msg.tool_calls or []))
        ),
        None,
    )
    if not last_ai:
        return {}

    edited_args: dict = state.get("edited_args") or {}

    tool_results = []
    course_id_update: dict = {}
    for tc in last_ai.tool_calls:
        if tc["name"] not in MUTATION_TOOLS:
            continue
        args = {**tc["args"], **edited_args} if edited_args else tc["args"]
        result = await tool_map[tc["name"]].ainvoke(args)
        tool_results.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
        if tc["name"] == "create_course" and isinstance(result, dict) and result.get("id"):
            course_id_update = {"course_id": result["id"]}

    return {"messages": tool_results, "step_completed": True, "edited_args": None, **course_id_update}


# --- Graph ---

tool_executor = ToolNode(read_tools)

builder = StateGraph(CourseBuilderState, input_schema=CourseBuilderInput)

builder.add_node("guide", guide)
builder.add_node("agent", agent)
builder.add_node("tool_executor", tool_executor)
builder.add_node("confirm", confirm)
builder.add_node("execute", execute)

builder.add_edge(START, "guide")
builder.add_edge("guide", "agent")
builder.add_conditional_edges(
    "agent",
    should_continue,
    {"continue": "tool_executor", "confirm": "confirm", "end": END},
)
builder.add_edge("tool_executor", "agent")
# confirm uses Command for routing — no conditional edge needed here
builder.add_edge("execute", "guide")

graph = builder.compile()
