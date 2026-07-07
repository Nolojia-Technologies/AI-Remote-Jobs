"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users as UsersIcon, Radio, Activity, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration, timeAgo, formatNumber } from "@/lib/utils";
import type { UserOverview, ActivityFilter, ActivityStats } from "@/lib/services/users";

// Must mirror the windows in lib/services/users.ts (kept local so this client
// component doesn't import the server-only service module).
const LIVE_WINDOW_MS = 15 * 60 * 1000;
const ACTIVE_WINDOW_MS = 7 * 86400000;

function activityBadge(lastSeen: string | null): { label: string; variant: "success" | "secondary" | "muted" } {
  if (!lastSeen) return { label: "Inactive", variant: "muted" };
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < LIVE_WINDOW_MS) return { label: "Live", variant: "success" };
  if (diff < ACTIVE_WINDOW_MS) return { label: "Active", variant: "secondary" };
  return { label: "Inactive", variant: "muted" };
}

export function UsersClient({
  users, stats, query, filter,
}: {
  users: UserOverview[];
  stats: ActivityStats;
  query: string;
  filter: ActivityFilter;
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);

  function apply(next: { q?: string; filter?: string }) {
    const params = new URLSearchParams();
    const merged = { q, filter, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.filter && merged.filter !== "all") params.set("filter", merged.filter);
    router.push(`/users?${params.toString()}`);
  }

  const tiles = [
    { label: "Total users", value: stats.total, icon: UsersIcon, tone: "text-foreground" },
    { label: "Live now (15m)", value: stats.live, icon: Radio, tone: "text-green-600" },
    { label: "Active (7d)", value: stats.active, icon: Activity, tone: "text-blue-600" },
    { label: "New (7d)", value: stats.new7d, icon: UserPlus, tone: "text-amber-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <t.icon className={`h-5 w-5 ${t.tone}`} />
            </div>
            <div>
              <div className="text-2xl font-bold leading-none">{formatNumber(t.value)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form onSubmit={(e) => { e.preventDefault(); apply({ q }); }} className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="pl-8" />
        </form>
        <Select value={filter} onChange={(e) => apply({ filter: e.target.value })} className="sm:w-48">
          <option value="all">All users</option>
          <option value="live">Live now (15m)</option>
          <option value="active">Active (7 days)</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Country</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Last active</TableHead>
              <TableHead className="hidden md:table-cell">Using for</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No users match.</TableCell></TableRow>
            )}
            {users.map((u) => {
              const badge = activityBadge(u.last_seen);
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.full_name || "—"} {u.is_admin && <Badge variant="secondary" className="ml-1">Admin</Badge>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{u.email || "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{u.country || "—"}</TableCell>
                  <TableCell>{u.level ?? 1}</TableCell>
                  <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{u.last_seen ? timeAgo(u.last_seen) : "never"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground" title={`Joined ${new Date(u.created_at).toLocaleDateString()}`}>
                    {formatDuration(u.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
