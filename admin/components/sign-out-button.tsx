"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
