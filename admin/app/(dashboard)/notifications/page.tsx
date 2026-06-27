import { notificationsService } from "@/lib/services/notifications";
import { PageHeader } from "@/components/page-header";
import { NotificationsClient } from "./_components/notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  let recent: any[] = [];
  try {
    recent = await notificationsService.list(30);
  } catch {
    recent = [];
  }

  return (
    <div>
      <PageHeader title="Notifications" description="Compose targeted campaigns. Records intent + targeting; device fan-out is dispatched by a worker." />
      <NotificationsClient recent={recent} />
    </div>
  );
}
