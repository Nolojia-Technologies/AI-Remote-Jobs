import { PageHeader } from "@/components/page-header";
import { getAiStatus } from "./actions";
import { AiApisClient } from "./_components/ai-apis-client";

export const dynamic = "force-dynamic";

export default async function AiApisPage() {
  const status = await getAiStatus();
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI APIs"
        description="Choose your AI provider and add your API key. Changes take effect immediately — no redeploy."
      />
      <AiApisClient status={status} />
    </div>
  );
}
