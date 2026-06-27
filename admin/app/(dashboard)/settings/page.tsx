import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getAdminEmails(): Promise<string[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("admin_emails").select("email").order("email");
    return (data ?? []).map((r: any) => r.email);
  } catch {
    return [];
  }
}

function EnvRow({ label, ok, note }: { label: string; ok: boolean; note?: string }) {
  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
      <span className="font-mono text-xs">{label}</span>
      {note && <span className="text-muted-foreground">— {note}</span>}
    </li>
  );
}

export default async function SettingsPage() {
  const emails = await getAdminEmails();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Portal configuration and access control." />

      <Card>
        <CardHeader><CardTitle className="text-base">Admin whitelist</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Only these emails can sign in (the <code>admin_emails</code> table, enforced by the <code>is_admin()</code> RLS function). Add or remove rows in Supabase to manage access — the architecture already supports multiple admins.
          </p>
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin emails found (or the service-role key isn’t set).</p>
          ) : (
            <div className="flex flex-wrap gap-2">{emails.map((e) => <Badge key={e} variant="secondary">{e}</Badge>)}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Environment</CardTitle></CardHeader>
        <CardContent>
          <ul>
            <EnvRow label="NEXT_PUBLIC_SUPABASE_URL" ok={!!process.env.NEXT_PUBLIC_SUPABASE_URL} />
            <EnvRow label="NEXT_PUBLIC_SUPABASE_ANON_KEY" ok={!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} />
            <EnvRow label="SUPABASE_SERVICE_ROLE_KEY" ok={!!process.env.SUPABASE_SERVICE_ROLE_KEY} note="server-only" />
            <EnvRow
              label="AI_PROVIDER"
              ok={true}
              note={`active: ${process.env.AI_PROVIDER || (process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY ? "anthropic (auto)" : "openai (auto)")}`}
            />
            <EnvRow label="ANTHROPIC_API_KEY" ok={!!process.env.ANTHROPIC_API_KEY} note="Claude — when AI_PROVIDER=anthropic" />
            <EnvRow label="ANTHROPIC_MODEL" ok={!!process.env.ANTHROPIC_MODEL} note="defaults to claude-opus-4-8" />
            <EnvRow label="OPENAI_API_KEY" ok={!!process.env.OPENAI_API_KEY} note="GPT + thumbnails (images)" />
            <EnvRow label="OPENAI_MODEL" ok={!!process.env.OPENAI_MODEL} note="defaults to gpt-5" />
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Roadmap</CardTitle></CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Manage admins from the UI (invite / revoke)</li>
            <li>Bulk imports &amp; CSV uploads for courses and jobs</li>
            <li>Translations (English, Swahili, Arabic, French) via a <code>locale</code> column</li>
            <li>AI-generated certificates, career coach, resume builder, interview simulator</li>
            <li>Affiliate marketplace, premium subscriptions, community features</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
