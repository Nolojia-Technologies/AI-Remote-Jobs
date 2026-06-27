"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { notificationsService, type NotificationInput } from "@/lib/services/notifications";

export async function sendNotificationAction(input: NotificationInput) {
  const { email } = await requireAdmin();
  const n = await notificationsService.create(input, email);
  revalidatePath("/notifications");
  return n;
}
