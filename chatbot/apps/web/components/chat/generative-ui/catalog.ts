import { defineCatalog } from "@json-render/core"
import { schema } from "@json-render/react/schema"
import { z } from "zod"

export const catalog = defineCatalog(schema, {
  components: {
    CoursePreviewCard: {
      description: "A card showing a full course preview with title, description, and metadata",
      props: z.object({
        title: z.string(),
        description: z.string(),
        instructor: z.string(),
        category: z.string(),
        level: z.string(),
        status: z.enum(["draft", "published"]).optional(),
      }),
    },
    ModuleSection: {
      description: "A collapsible section showing a module with its lessons",
      props: z.object({
        title: z.string(),
        lessonCount: z.number(),
      }),
    },
    LessonRow: {
      description: "A single lesson row showing title and type badge",
      props: z.object({
        title: z.string(),
        type: z.enum(["video", "article", "quiz", "assignment"]),
      }),
    },
    MetadataRow: {
      description: "A key-value metadata row",
      props: z.object({
        label: z.string(),
        value: z.string(),
      }),
    },
    SectionDivider: {
      description: "A horizontal divider between sections",
      props: z.object({}),
    },
    Container: {
      description: "A vertical stack container for grouping elements",
      props: z.object({
        gap: z.enum(["sm", "md", "lg"]).optional(),
      }),
    },
  },
  actions: {},
})
