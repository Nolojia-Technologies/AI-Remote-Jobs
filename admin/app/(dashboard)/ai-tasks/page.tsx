import { aiTasksService, type AiTaskKind, type AiTaskStatus } from "@/lib/services/aiTasks";
import { PageHeader } from "@/components/page-header";
import { AiTasksClient } from "./_components/tasks-client";

export const dynamic = "force-dynamic";

export default async function AiTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; kind?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status as AiTaskStatus | "all") || "all";
  const kind = (sp.kind as AiTaskKind | "all") || "all";
  const tasks = await aiTasksService.list({ search: sp.q, status, kind });

  return (
    <div>
      <PageHeader
        title="AI Tasks"
        description="Manage the earning hub: micro tasks, captchas, annotation tasks and surveys."
      />
      <AiTasksClient initialTasks={tasks} query={sp.q ?? ""} status={status} kind={kind} />
    </div>
  );
}
