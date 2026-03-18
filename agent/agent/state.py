from typing import Literal, TypedDict

from langgraph.graph import MessagesState


class GuideStep(TypedDict):
    id: str
    title: str
    description: str
    status: Literal["completed", "active", "pending"]


DEFAULT_GUIDE_STEPS: list[GuideStep] = [
    {
        "id": "name_course",
        "title": "Name your course",
        "description": "Choose a clear, descriptive title for your course",
        "status": "pending",
    },
    {
        "id": "add_description",
        "title": "Add a description",
        "description": "Write a short summary of what students will learn",
        "status": "pending",
    },
    {
        "id": "add_module",
        "title": "Create your first module",
        "description": "Organize your content into logical sections",
        "status": "pending",
    },
    {
        "id": "add_lesson",
        "title": "Add a lesson to the module",
        "description": "Add your first piece of course content",
        "status": "pending",
    },
    {
        "id": "publish",
        "title": "Preview & publish",
        "description": "Review your course and make it available to students",
        "status": "pending",
    },
]


class CourseBuilderState(MessagesState):
    guide_steps: list[GuideStep]
    current_step_id: str
    course_id: str | None
    page_context: dict


class CourseBuilderInput(MessagesState):
    page_context: dict
