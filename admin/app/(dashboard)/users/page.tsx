import { usersService, type ActivityFilter } from "@/lib/services/users";
import { PageHeader } from "@/components/page-header";
import { UsersClient } from "./_components/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const sp = await searchParams;
  const filter = (["all", "live", "active", "inactive"].includes(sp.filter ?? "") ? sp.filter : "all") as ActivityFilter;

  const [users, stats] = await Promise.all([
    usersService.listOverview({ search: sp.q, filter, limit: 200 }),
    usersService.activityStats(),
  ]);

  return (
    <div>
      <PageHeader title="Users" description="Learners on AI Remote Jobs — filter by activity and see how long they've used the app." />
      <UsersClient users={users} stats={stats} query={sp.q ?? ""} filter={filter} />
    </div>
  );
}
