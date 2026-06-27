import { usersService } from "@/lib/services/users";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const users = await usersService.list({ search: q, limit: 200 });

  return (
    <div>
      <PageHeader title="Users" description="Learners on AI Hustle Academy. (Read-only — moderation tools are a follow-up.)" />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Country</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="hidden sm:table-cell">XP</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No users yet.</TableCell></TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.full_name || "—"} {u.is_admin && <Badge variant="secondary" className="ml-1">Admin</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{u.country || "—"}</TableCell>
                <TableCell>{u.level ?? 1}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{u.xp ?? 0}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{timeAgo(u.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
