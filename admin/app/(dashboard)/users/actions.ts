"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { usersService } from "@/lib/services/users";

export async function setUserDisabledAction(userId: string, disabled: boolean) {
  const { email } = await requireAdmin();
  await usersService.setDisabled(userId, disabled, email);
  revalidatePath("/users");
}
