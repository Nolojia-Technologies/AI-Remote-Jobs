"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Settings2, ListTree, FileUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COURSE_STATUS_LABELS } from "@/types/db";
import type { Course, Stage, Chapter, Lesson, Quiz } from "@/types/db";
import { DetailsForm } from "./details-form";
import { StructureTree } from "./structure-tree";

export function CourseEditor({
  course,
  stages,
  chapters,
  lessons,
  quizzes,
}: {
  course: Course;
  stages: Stage[];
  chapters: Chapter[];
  lessons: Lesson[];
  quizzes: Quiz[];
}) {
  const [tab, setTab] = useState<"details" | "structure">("details");

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
        <Badge variant={course.status === "published" ? "success" : course.status === "archived" ? "warning" : "muted"}>
          {COURSE_STATUS_LABELS[course.status]}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/courses/${course.id}/import`}>
            <Button variant="outline" size="sm">
              <FileUp className="h-4 w-4" /> Import from PDF
            </Button>
          </Link>
          <Link href={`/ai?courseId=${course.id}`}>
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4" /> Generate / improve with AI
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-5 inline-flex rounded-lg border bg-card p-1">
        {([
          { key: "details", label: "Details", icon: Settings2 },
          { key: "structure", label: "Structure", icon: ListTree },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <DetailsForm course={course} />
      ) : (
        <StructureTree courseId={course.id} stages={stages} chapters={chapters} lessons={lessons} quizzes={quizzes} />
      )}
    </div>
  );
}
