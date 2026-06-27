import { coursesService } from "@/lib/services/courses";
import { PageHeader } from "@/components/page-header";
import { CoursesClient } from "./_components/courses-client";
import type { CourseStatus } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status as CourseStatus | "all") || "all";
  const courses = await coursesService.list({
    search: sp.q,
    status,
    sort: (sp.sort as any) || "order",
  });

  return (
    <div>
      <PageHeader title="Courses" description="Create, structure, and publish the learning catalog." />
      <CoursesClient initialCourses={courses} query={sp.q ?? ""} status={status} sort={sp.sort ?? "order"} />
    </div>
  );
}
