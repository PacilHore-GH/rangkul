import { ReactNode } from "react";

import { AppGuard } from "@/components/app-guard";
import { AppShell } from "@/components/app-shell";
import { ActivePersonProvider } from "@/features/people/active-person-context";

export function JournalPageFrame({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppGuard>
      <ActivePersonProvider>
        <AppShell title={title} description={description} action={action}>
          {children}
        </AppShell>
      </ActivePersonProvider>
    </AppGuard>
  );
}
