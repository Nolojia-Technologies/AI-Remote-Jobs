import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { coursesService } from "@/lib/services/courses";
import { stagesService } from "@/lib/services/stages";
import { chaptersService } from "@/lib/services/chapters";
import { lessonsService } from "@/lib/services/lessons";
import { quizzesService } from "@/lib/services/quizzes";
import { Button } from "@/components/ui/button";
import { CourseEditor } from "./_components/course-editor";

export const dynamic = "force-dynamic";

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await coursesService.get(id);
  if (!course) notFound();

  const [stages, chapters, lessons, quizzes] = await Promise.all([
    stagesService.listByCourse(id),
    chaptersService.listByCourse(id),
    lessonsService.listByCourse(id),
    quizzesService.listByCourse(id),
  ]);

  return (
    <div>
      <Link href="/courses">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Button>
      </Link>
      <CourseEditor course={course} stages={stages} chapters={chapters} lessons={lessons} quizzes={quizzes} />
    </div>
  );
}
