import httpx
from langchain_core.tools import tool

BASE_URL = "http://localhost:3000/api"


@tool
async def get_courses() -> list | str:
    """Get all courses."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/courses")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return str(e)


@tool
async def get_course(course_id: str) -> dict | str:
    """Get a single course by ID."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/courses/{course_id}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return str(e)


@tool
async def create_course(
    title: str,
    description: str,
    instructor: str,
    category: str,
    level: str = "Beginner",
) -> dict | str:
    """Create a new course."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/courses",
                json={
                    "title": title,
                    "description": description,
                    "instructor": instructor,
                    "category": category,
                    "level": level,
                    "status": "draft",
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return str(e)


@tool
async def update_course(course_id: str, data: dict) -> dict | str:
    """Update a course by ID with the provided data."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(f"{BASE_URL}/courses/{course_id}", json=data)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return str(e)


@tool
async def add_module(course_id: str, module_title: str) -> dict | str:
    """Add a module to a course."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/courses/{course_id}")
            response.raise_for_status()
            course = response.json()

            modules = course.get("modules", [])
            modules.append({"title": module_title, "lessons": []})

            response = await client.put(
                f"{BASE_URL}/courses/{course_id}",
                json={"modules": modules},
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return str(e)


@tool
async def add_lesson(
    course_id: str,
    module_title: str,
    lesson_title: str,
    lesson_type: str = "video",
) -> dict | str:
    """Add a lesson to a module within a course."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/courses/{course_id}")
            response.raise_for_status()
            course = response.json()

            modules = course.get("modules", [])
            module = next((m for m in modules if m["title"] == module_title), None)
            if module is None:
                return f"Module '{module_title}' not found in course '{course_id}'"

            module["lessons"].append({"title": lesson_title, "type": lesson_type})

            response = await client.put(
                f"{BASE_URL}/courses/{course_id}",
                json={"modules": modules},
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return str(e)


@tool
def suggest_options(options: list[str], prompt_text: str, field_name: str) -> str:
    """Suggest a list of options for the user to choose from.

    Args:
        options: List of suggested options the user can pick from
        prompt_text: The question or prompt to show above the options
        field_name: What field this suggestion is for (e.g. "course_title", "category", "module_name", "lesson_type")

    Returns:
        This tool is used to display suggestions in the UI. It does not need to execute.
    """
    return "Options displayed to user"


@tool
def reset_guide() -> str:
    """Reset the course builder guide to start creating a new course.
    Call this when the user wants to create another course after completing all steps."""
    return "Guide reset requested"


@tool
async def publish_course(course_id: str) -> dict | str:
    """Publish a course by setting its status to published."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{BASE_URL}/courses/{course_id}",
                json={"status": "published"},
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return str(e)
