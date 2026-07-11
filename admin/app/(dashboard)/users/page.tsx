import { usersService, type ActivityFilter, type UserSort } from "@/lib/services/users";
import { PageHeader } from "@/components/page-header";
import { UsersClient } from "./_components/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; sort?: string }> }) {
  const sp = await searchParams;
  const filter = (["all", "live", "active", "inactive", "disabled"].includes(sp.filter ?? "") ? sp.filter : "all") as ActivityFilter;
  const sort = (sp.sort === "earners" ? "earners" : "recent") as UserSort;

  const [users, stats] = await Promise.all([
    usersService.listOverview({ search: sp.q, filter, sort, limit: 200 }),
    usersService.activityStats(),
  ]);

  return (
    <div>
      <PageHeader title="Users" description="Learners on AI Remote Jobs — activity, earnings, and account controls." />
      <UsersClient users={users} stats={stats} query={sp.q ?? ""} filter={filter} sort={sort} />
    </div>
  );
}
