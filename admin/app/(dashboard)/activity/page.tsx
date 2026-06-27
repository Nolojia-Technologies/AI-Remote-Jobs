import { activityService } from "@/lib/services/activity";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const activity = await activityService.recent(100);

  return (
    <div>
      <PageHeader title="Admin Activity" description="Audit log of every change made through the portal." />
      <Card>
        <CardContent className="p-0">
          {activity.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <Badge variant="muted" className="shrink-0 capitalize">{a.action}</Badge>
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{a.admin_email ?? "admin"}</span>{" "}
                    <span className="text-muted-foreground">{a.entity}{a.detail ? ` · ${a.detail}` : ""}</span>
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
