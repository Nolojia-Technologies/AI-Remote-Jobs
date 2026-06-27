import { adminRoute, logGeneration } from "@/lib/api";
import { generateThumbnail } from "@/lib/ai/provider";
import { thumbnailPrompt } from "@/lib/ai/prompts";
import { coursesService } from "@/lib/services/courses";
import { mediaService } from "@/lib/services/media";

export const maxDuration = 180;

/** Generate + store a course thumbnail, then set it on the course. Body: { courseId }. */
export const POST = adminRoute<{ courseId: string }>(async (body, ctx) => {
  const course = await coursesService.get(body.courseId);
  if (!course) throw new Error("Course not found");

  const png = await generateThumbnail(thumbnailPrompt({ title: course.title, category: course.category }));
  const path = `${course.slug || course.id}-${Date.now()}.png`;
  const url = await mediaService.upload("course-thumbnails", path, png, "image/png");
  const updated = await coursesService.update(course.id, { thumbnail_url: url }, ctx.email);

  await logGeneration({ courseId: course.id, kind: "thumbnail", targetId: course.id, userId: ctx.userId });
  return { thumbnail_url: updated.thumbnail_url };
});
