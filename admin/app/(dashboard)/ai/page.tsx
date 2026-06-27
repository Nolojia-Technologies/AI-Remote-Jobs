import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { coursesService } from "@/lib/services/courses";
import { stagesService } from "@/lib/services/stages";
import { chaptersService } from "@/lib/services/chapters";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { AiClient } from "./_components/ai-client";

export const dynamic = "force-dynamic";

export default async function AiPage({ searchParams }: { searchParams: Promise<{ courseId?: string }> }) {
  const { courseId } = await searchParams;
  let course = null;
  let stages: { id: string; title: string }[] = [];
  let chapters: { id: string; title: string; stage_id: string | null }[] = [];

  if (courseId) {
    const c = await coursesService.get(courseId);
    if (c) {
      course = { id: c.id, title: c.title, thumbnail_url: c.thumbnail_url };
      const [s, ch] = await Promise.all([stagesService.listByCourse(courseId), chaptersService.listByCourse(courseId)]);
      stages = s.map((x) => ({ id: x.id, title: x.title }));
      chapters = ch.map((x) => ({ id: x.id, title: x.title, stage_id: x.stage_id }));
    }
  }

  return (
    <div>
      {course && (
        <Link href={`/courses/${course.id}`}>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to course
          </Button>
        </Link>
      )}
      <PageHeader
        title="AI Generation"
        description="Generate professional course content in layers with GPT or Claude (set AI_PROVIDER). Everything is saved as draft for review before publishing."
      />
      <AiClient course={course} stages={stages} chapters={chapters} />
    </div>
  );
}
