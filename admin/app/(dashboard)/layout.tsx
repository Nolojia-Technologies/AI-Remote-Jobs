import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defence in depth — middleware already guards, but never render the shell for
  // a non-admin if middleware is ever misconfigured.
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/login?denied=1");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
        <div className="sticky top-0">
          <Sidebar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
          <div className="text-sm text-muted-foreground md:hidden">AI Hustle Admin</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
