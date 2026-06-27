import { jobsService } from "@/lib/services/jobs";
import { coursesService } from "@/lib/services/courses";
import { PageHeader } from "@/components/page-header";
import { JobsClient } from "./_components/jobs-client";
import type { JobStatus } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status as JobStatus | "all") || "all";
  const [jobs, courses] = await Promise.all([
    jobsService.list({ search: sp.q, status }),
    coursesService.list({ status: "all", sort: "title" }),
  ]);

  return (
    <div>
      <PageHeader title="Jobs" description="Manage remote opportunities and their course/XP requirements." />
      <JobsClient
        initialJobs={jobs}
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        query={sp.q ?? ""}
        status={status}
      />
    </div>
  );
}
