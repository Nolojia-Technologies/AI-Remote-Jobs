import Link from "next/link";
import {
  Users,
  Activity,
  BookOpen,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  DollarSign,
  Timer,
  Repeat,
  Sparkles,
} from "lucide-react";
import { analyticsService } from "@/lib/services/analytics";
import { activityService } from "@/lib/services/activity";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercent, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, activity] = await Promise.all([
    analyticsService.dashboard(),
    activityService.recent(12),
  ]);

  const cards = [
    { label: "Total Users", value: formatNumber(stats.totalUsers), icon: Users },
    { label: "Daily Active Users", value: formatNumber(stats.dailyActiveUsers), icon: Activity },
    { label: "Courses", value: formatNumber(stats.totalCourses), icon: BookOpen, hint: `${stats.publishedCourses} published` },
    { label: "Jobs", value: formatNumber(stats.totalJobs), icon: Briefcase, hint: `${stats.publishedJobs} published` },
    { label: "Course Completions", value: formatNumber(stats.courseCompletions), icon: CheckCircle2 },
    { label: "Quiz Pass Rate", value: formatPercent(stats.quizPassRate), icon: GraduationCap },
    { label: "Ad Revenue (est.)", value: `$${formatNumber(stats.adRevenueEstimate)}`, icon: DollarSign, hint: "30-day estimate" },
    { label: "Avg Session", value: stats.avgSessionMinutes ? `${stats.avgSessionMinutes}m` : "—", icon: Timer },
    { label: "7-Day Retention", value: formatPercent(stats.retentionRate), icon: Repeat },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Live overview of AI Hustle Academy.">
        <Link href="/ai">
          <Button>
            <Sparkles className="h-4 w-4" />
            Generate course
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-3">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} hint={c.hint} />
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No admin activity yet. Actions you take in the portal will appear here.
            </p>
          ) : (
            <ul className="divide-y">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{a.admin_email ?? "admin"}</span>{" "}
                    <span className="text-muted-foreground">
                      {a.action} {a.entity}
                      {a.detail ? ` · ${a.detail}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 pl-3 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
