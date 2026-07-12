"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Users as UsersIcon, Radio, Activity, UserPlus, Loader2, Ban, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration, timeAgo, formatNumber } from "@/lib/utils";
import type { UserOverview, ActivityFilter, ActivityStats, UserSort } from "@/lib/services/users";
import { setUserDisabledAction } from "../actions";

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

// Earnings are stored in MILLS (1/1000 USD) since migration 025.
const usd = (mills: number) => {
  const v = (mills || 0) / 1000;
  return `$${v.toFixed(v > 0 && v < 0.1 ? 3 : 2)}`;
};

export function UsersClient({
  users, stats, query, filter, sort,
}: {
  users: UserOverview[];
  stats: ActivityStats;
  query: string;
  filter: ActivityFilter;
  sort: UserSort;
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function apply(next: { q?: string; filter?: string; sort?: string }) {
    const params = new URLSearchParams();
    const merged = { q, filter, sort, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.filter && merged.filter !== "all") params.set("filter", merged.filter);
    if (merged.sort && merged.sort !== "recent") params.set("sort", merged.sort);
    router.push(`/users?${params.toString()}`);
  }

  function toggleDisabled(u: UserOverview) {
    const verb = u.is_disabled ? "Reactivate" : "Deactivate";
    if (!confirm(`${verb} ${u.full_name || u.email || "this user"}? ${u.is_disabled ? "They will be able to sign in again." : "They will be blocked from signing in and their session will end."}`)) return;
    setBusyId(u.id);
    startTransition(async () => {
      try {
        await setUserDisabledAction(u.id, !u.is_disabled);
      } finally {
        setBusyId(null);
        router.refresh();
      }
    });
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
        <Select value={filter} onChange={(e) => apply({ filter: e.target.value })} className="sm:w-44">
          <option value="all">All users</option>
          <option value="live">Live now (15m)</option>
          <option value="active">Active (7 days)</option>
          <option value="inactive">Inactive</option>
          <option value="disabled">Deactivated</option>
        </Select>
        <Select value={sort} onChange={(e) => apply({ sort: e.target.value })} className="sm:w-44">
          <option value="recent">Most recent</option>
          <option value="earners">🏆 Top earners</option>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>
                <span className="inline-flex items-center gap-1">
                  {sort === "earners" && <Trophy className="h-3.5 w-3.5 text-amber-500" />} Earned
                </span>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Balance</TableHead>
              <TableHead className="hidden sm:table-cell">Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Last active</TableHead>
              <TableHead className="hidden lg:table-cell">Using for</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">No users match.</TableCell></TableRow>
            )}
            {users.map((u, i) => {
              const badge = activityBadge(u.last_seen);
              return (
                <TableRow key={u.id} className={u.is_disabled ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    {sort === "earners" && i < 3 && <span className="mr-1">{["🥇", "🥈", "🥉"][i]}</span>}
                    {u.full_name || "—"}
                    {u.is_admin && <Badge variant="secondary" className="ml-1">Admin</Badge>}
                    {u.is_disabled && <Badge variant="warning" className="ml-1">Deactivated</Badge>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{u.email || "—"}</TableCell>
                  <TableCell className={u.lifetime_cents > 0 ? "font-semibold text-green-600" : "text-muted-foreground"}>
                    {usd(u.lifetime_cents)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{usd(u.balance_cents)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{u.level ?? 1}</TableCell>
                  <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{u.last_seen ? timeAgo(u.last_seen) : "never"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground" title={`Joined ${new Date(u.created_at).toLocaleDateString()}`}>
                    {formatDuration(u.created_at)}
                  </TableCell>
                  <TableCell>
                    {!u.is_admin && (
                      <Button
                        variant={u.is_disabled ? "outline" : "ghost"}
                        size="sm"
                        disabled={pending && busyId === u.id}
                        onClick={() => toggleDisabled(u)}
                        className={u.is_disabled ? "" : "text-destructive hover:text-destructive"}
                      >
                        {pending && busyId === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : u.is_disabled ? (
                          <><RotateCcw className="h-3.5 w-3.5" /> Reactivate</>
                        ) : (
                          <><Ban className="h-3.5 w-3.5" /> Deactivate</>
                        )}
                      </Button>
                    )}
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
