import { adminRoute, logGeneration } from "@/lib/api";
import { generateJSON } from "@/lib/ai/provider";
import { structureSchema } from "@/lib/ai/schema";
import { structurePrompt } from "@/lib/ai/prompts";
import { coursesService } from "@/lib/services/courses";
import { stagesService } from "@/lib/services/stages";
import { chaptersService } from "@/lib/services/chapters";

export const maxDuration = 300;

/**
 * Layer 1 — generate course structure (course + stages + chapters).
 * Body: { topic, difficulty, market, courseId? }. Creates a draft course when no
 * courseId is supplied. Never one-shots lessons/quizzes — those are later layers.
 */
export const POST = adminRoute<{ topic: string; difficulty?: string; market?: string; courseId?: string }>(
  async (body, ctx) => {
    const difficulty = body.difficulty || "beginner";
    const market = body.market || "Global Remote";
    const prompt = structurePrompt({ topic: body.topic, difficulty, market });
    const out = await generateJSON({ ...prompt, schema: structureSchema });

    // Target course — reuse or create a fresh draft.
    let courseId = body.courseId;
    if (courseId) {
      await coursesService.update(courseId, { description: out.course.description, tags: out.course.tags, ai_generated: true }, ctx.email);
    } else {
      const course = await coursesService.create(
        {
          title: out.course.title,
          description: out.course.description,
          category: body.topic,
          difficulty: difficulty as any,
          tags: out.course.tags,
          status: "draft",
          ai_generated: true,
        },
        ctx.email
      );
      courseId = course.id;
    }

    // Persist stages + chapters.
    const stages = [];
    for (let si = 0; si < out.stages.length; si++) {
      const s = out.stages[si];
      const stage = await stagesService.create({ course_id: courseId, title: s.title, description: s.description, order_index: si }, ctx.email);
      const chapters = [];
      for (let ci = 0; ci < s.chapters.length; ci++) {
        const c = s.chapters[ci];
        const chapter = await chaptersService.create(
          { course_id: courseId, stage_id: stage.id, title: c.title, description: c.description, is_milestone: c.is_milestone, order_index: ci },
          ctx.email
        );
        chapters.push({ id: chapter.id, title: chapter.title, is_milestone: chapter.is_milestone });
      }
      stages.push({ id: stage.id, title: stage.title, chapters });
    }

    await logGeneration({ courseId, kind: "structure", targetId: courseId, userId: ctx.userId, prompt: body.topic });
    return { courseId, stages };
  }
);
