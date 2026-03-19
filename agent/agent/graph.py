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
    complete_step,
    course_preview,
    create_course,
    get_course,
    get_courses,
    publish_course,
    reset_guide,
    suggest_options,
    update_course,
)

MUTATION_TOOLS = ["create_course", "update_course", "add_module", "add_lesson", "publish_course", "reset_guide", "complete_step"]
# Tools that go through the mutation path but bypass the confirmation dialog
SILENT_MUTATION_TOOLS = {"complete_step", "reset_guide"}
READ_TOOLS = ["get_courses", "get_course", "suggest_options", "course_preview"]

read_tools = [get_courses, get_course, suggest_options, course_preview]
mutation_tools = [create_course, update_course, add_module, add_lesson, publish_course, reset_guide, complete_step]
all_tools = read_tools + mutation_tools

tool_map = {t.name: t for t in all_tools}

llm = ChatAnthropic(model_name="claude-sonnet-4-20250514", stop=None, temperature=0, timeout=300)
llm_with_tools = llm.bind_tools(all_tools)


# --- Nodes ---

def guide(state: CourseBuilderState) -> dict:
    guide_steps = state.get("guide_steps") or []

    # First run OR explicit reset: initialize fresh steps
    if not guide_steps or state.get("reset_guide"):
        steps = copy.deepcopy(DEFAULT_GUIDE_STEPS)
        steps[0]["status"] = "active"
        return {
            "guide_steps": steps,
            "current_step_id": steps[0]["id"],
            "course_id": None,
            "reset_guide": False,
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
    return {
        "guide_steps": steps,
        "current_step_id": "",
        "step_completed": False,
    }


async def agent(state: CourseBuilderState) -> dict:
    guide_steps = state.get("guide_steps") or []
    current_step_id = state.get("current_step_id", "")

    steps_text = "\n".join(
        f"- [{s['status'].upper()}] {s['title']}: {s['description']}"
        for s in guide_steps
    )
    current_step = next((s for s in guide_steps if s["id"] == current_step_id), None)
    current_step_text = current_step["title"] if current_step else "unknown"

    all_completed = all(s["status"] == "completed" for s in guide_steps) if guide_steps else False
    new_course_hint = (
        "\n\nAll steps have been completed! If the user wants to create another course, call the reset_guide tool."
        if all_completed
        else ""
    )

    page_context = state.get("page_context") or {}
    course_id = state.get("course_id")

    page_context_text = ""
    if page_context:
        page_context_text = "\n\nUser's current page:"
        page_context_text += f"\n- Path: {page_context.get('path', 'unknown')}"
        if page_context.get("pageTitle"):
            page_context_text += f"\n- Page title: {page_context['pageTitle']}"
        if page_context.get("courseTitle"):
            page_context_text += f"\n- Viewing course: {page_context['courseTitle']}"
            page_context_text += f"\n- Modules: {page_context.get('modulesCount', 0)}"
            page_context_text += f"\n- Lessons: {page_context.get('lessonsCount', 0)}"
            page_context_text += f"\n- Status: {page_context.get('courseStatus', 'unknown')}"

    course_id_text = f"\n\nCurrent course ID: {course_id}" if course_id else ""

    system = SystemMessage(content=f"""You are a course builder assistant guiding the user through creating a course step by step.

Current guide steps:
{steps_text}

The current active step is: {current_step_text}{page_context_text}{course_id_text}

Focus on helping the user complete the current step. Ask for any information you need.
You can call get_courses or get_course anytime to check the current state.
When you have enough information to take action, call the appropriate tool \
(create_course, update_course, add_module, add_lesson, publish_course) with the proposed data. \
Your mutation tool calls will be shown to the user for confirmation before being executed.

IMPORTANT: If the active step is already done (e.g. the description was included in create_course, \
so add_description is still "active" but the course already has a description), call complete_step \
immediately to advance the guide — do NOT ask the user to redo the step. This runs silently with no \
confirmation dialog.

When asking the user for input on a step, ALWAYS call the suggest_options tool alongside your text response with 3-5 relevant suggestions. For example:
- When asking for a course title: suggest 3-4 course name ideas based on the topic
- When asking for a category: suggest relevant categories (e.g. Programming, Design, Business, Marketing)
- When asking for a module name: suggest module name ideas based on the course topic
- When asking for a lesson title: suggest lesson title ideas based on the module
- When asking for lesson type: suggest from available types — video, article, quiz, assignment
Call suggest_options in the same response as your text message. The user can click a suggestion or type their own answer.

When the user reaches the "publish" step, ALWAYS call the course_preview tool first to show them a visual preview of their course before asking to publish. Use get_course to fetch the full course data, then build the spec. Example spec structure:
{{
  "root": "preview-container",
  "elements": {{
    "preview-container": {{"type": "Container", "props": {{"gap": "md"}}, "children": ["course-card", "divider-1", "modules-container"]}},
    "course-card": {{"type": "CoursePreviewCard", "props": {{"title": "...", "description": "...", "instructor": "...", "category": "...", "level": "...", "status": "draft"}}, "children": []}},
    "divider-1": {{"type": "SectionDivider", "props": {{}}, "children": []}},
    "modules-container": {{"type": "Container", "props": {{"gap": "sm"}}, "children": ["module-1"]}},
    "module-1": {{"type": "ModuleSection", "props": {{"title": "Getting Started", "lessonCount": 2}}, "children": ["lesson-1", "lesson-2"]}},
    "lesson-1": {{"type": "LessonRow", "props": {{"title": "What is Python?", "type": "video"}}, "children": []}},
    "lesson-2": {{"type": "LessonRow", "props": {{"title": "Installing Python", "type": "article"}}, "children": []}}
  }}
}}{new_course_hint}""")

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

    # Silent tools (complete_step, reset_guide) bypass the confirmation dialog
    if all(tc["name"] in SILENT_MUTATION_TOOLS for tc in mutation_calls):
        return Command(goto="execute")

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

        if tc["name"] == "complete_step":
            return {
                "messages": [ToolMessage(content="Step marked complete.", tool_call_id=tc["id"])],
                "step_completed": True,
            }

        if tc["name"] == "reset_guide":
            return {
                "messages": [ToolMessage(content="Guide reset. Starting fresh!", tool_call_id=tc["id"])],
                "step_completed": False,
                "reset_guide": True,
            }

        args = {**tc["args"], **edited_args} if edited_args else tc["args"]
        result = await tool_map[tc["name"]].ainvoke(args)
        tool_results.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
        if tc["name"] == "create_course" and isinstance(result, dict) and result.get("id"):
            course_id_update = {"course_id": result["id"]}

    return {
        "messages": tool_results,
        "step_completed": True,
        "edited_args": None,
        **course_id_update,
    }


UI_ONLY_TOOLS = {"suggest_options", "course_preview"}


def after_tools(state: CourseBuilderState) -> str:
    """After tool_executor runs, end the turn if only UI-only tools were called."""
    for msg in reversed(state["messages"]):
        if isinstance(msg, AIMessage):
            tool_names = [tc["name"] for tc in (msg.tool_calls or [])]
            if tool_names and all(t in UI_ONLY_TOOLS for t in tool_names):
                return "end"
            break
    return "agent"


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
builder.add_conditional_edges("tool_executor", after_tools, {"agent": "agent", "end": END})
# confirm uses Command for routing — no conditional edge needed here
builder.add_edge("execute", "guide")

graph = builder.compile()
