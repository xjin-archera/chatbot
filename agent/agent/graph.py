from langgraph.graph import StateGraph, END

from agent.state import CourseBuilderState


def assistant(state: CourseBuilderState) -> dict:  # noqa: ARG001
    return {}


builder = StateGraph(CourseBuilderState)
builder.add_node("assistant", assistant)
builder.set_entry_point("assistant")
builder.add_edge("assistant", END)

graph = builder.compile()
