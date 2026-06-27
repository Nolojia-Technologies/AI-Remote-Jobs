import { analyticsService } from "@/lib/services/analytics";
import { coursesService } from "@/lib/services/courses";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, CheckCircle2, GraduationCap, Repeat, DollarSign } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [stats, popular, courses] = await Promise.all([
    analyticsService.dashboard(),
    analyticsService.popularCourses(8),
    coursesService.list({ status: "all", sort: "title" }),
  ]);
  const titleFor = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  return (
    <div>
      <PageHeader title="Analytics" description="Engagement and learning metrics from live app events." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Users" value={formatNumber(stats.totalUsers)} icon={Users} />
        <StatCard label="Daily Active" value={formatNumber(stats.dailyActiveUsers)} icon={Activity} />
        <StatCard label="Course Completions" value={formatNumber(stats.courseCompletions)} icon={CheckCircle2} />
        <StatCard label="Quiz Pass Rate" value={formatPercent(stats.quizPassRate)} icon={GraduationCap} />
        <StatCard label="7-Day Retention" value={formatPercent(stats.retentionRate)} icon={Repeat} />
        <StatCard label="Ad Revenue (est.)" value={`$${formatNumber(stats.adRevenueEstimate)}`} icon={DollarSign} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Most Popular Courses</CardTitle></CardHeader>
        <CardContent>
          {popular.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No completion data yet.</p>
          ) : (
            <ul className="divide-y">
              {popular.map((p) => (
                <li key={p.course_id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="truncate">{titleFor(p.course_id)}</span>
                  <span className="text-muted-foreground">{formatNumber(p.completions)} completions</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        TODO: average session duration and most-popular-lessons need paired session events + lesson view events; ad revenue should read the AdMob/Meta reporting API server-side (currently a coarse estimate).
      </p>
    </div>
  );
}
