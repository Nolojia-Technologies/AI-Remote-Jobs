"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import { COUNTRIES } from "@/lib/constants";
import { sendNotificationAction } from "../actions";
import type { NotificationAudience } from "@/lib/services/notifications";

const TEMPLATES: Record<string, { title: string; body: string }> = {
  new_course: { title: "New course just dropped! 🎓", body: "A brand-new course is live. Tap to start learning and earn XP." },
  new_jobs: { title: "Fresh remote jobs added 💼", body: "New opportunities are waiting. Check if you’ve unlocked them!" },
  daily_reminder: { title: "Your daily lesson awaits ⏰", body: "Keep your streak alive — a quick lesson takes 5 minutes." },
  streak_reminder: { title: "Don’t lose your streak! 🔥", body: "Come back today to protect your learning streak." },
  comeback: { title: "We miss you 👋", body: "Come back and claim a bonus reward for returning." },
  special_event: { title: "Special event! 🎉", body: "Something special is happening in the app. Don’t miss out." },
};

export function NotificationsClient({ recent }: { recent: any[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [template, setTemplate] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceKind, setAudienceKind] = useState<NotificationAudience["kind"]>("all");
  const [country, setCountry] = useState<string>(COUNTRIES[0].name);
  const [minValue, setMinValue] = useState(0);

  function applyTemplate(key: string) {
    setTemplate(key);
    if (TEMPLATES[key]) {
      setTitle(TEMPLATES[key].title);
      setBody(TEMPLATES[key].body);
    }
  }

  function buildAudience(): NotificationAudience {
    switch (audienceKind) {
      case "country": return { kind: "country", country };
      case "level": return { kind: "level", min: Number(minValue) || 0 };
      case "streak": return { kind: "streak", min: Number(minValue) || 0 };
      case "xp": return { kind: "xp", min: Number(minValue) || 0 };
      default: return { kind: "all" };
    }
  }

  function send() {
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      await sendNotificationAction({ title: title.trim(), body: body.trim(), template: template || undefined, audience: buildAudience() });
      setDone(true);
      setTitle(""); setBody(""); setTemplate("");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Compose</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select value={template} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">Custom</option>
              <option value="new_course">New course</option>
              <option value="new_jobs">New jobs</option>
              <option value="daily_reminder">Daily reminder</option>
              <option value="streak_reminder">Streak reminder</option>
              <option value="comeback">Comeback reward</option>
              <option value="special_event">Special event</option>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => { setTitle(e.target.value); setDone(false); }} /></div>
          <div className="space-y-1.5"><Label>Body</Label><Textarea value={body} onChange={(e) => { setBody(e.target.value); setDone(false); }} className="min-h-[80px]" /></div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={audienceKind} onChange={(e) => setAudienceKind(e.target.value as NotificationAudience["kind"])}>
                <option value="all">Everyone</option>
                <option value="level">By level (min)</option>
                <option value="country">By country</option>
                <option value="streak">By streak (min)</option>
                <option value="xp">By XP (min)</option>
              </Select>
            </div>
            {audienceKind === "country" ? (
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                </Select>
              </div>
            ) : audienceKind !== "all" ? (
              <div className="space-y-1.5">
                <Label>Minimum</Label>
                <Input type="number" value={minValue} onChange={(e) => setMinValue(Number(e.target.value))} />
              </div>
            ) : <div />}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={send} disabled={pending || !title.trim() || !body.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Queue notification
            </Button>
            {done && <span className="text-sm text-green-600">Queued ✓</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent campaigns</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No notifications sent yet.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((n) => (
                <li key={n.id} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{n.title}</span>
                    {n.status && <Badge variant="muted" className="ml-auto shrink-0">{n.status}</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
