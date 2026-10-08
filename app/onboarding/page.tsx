import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { BRAND, Logo } from "@/components/shared/brand";
import { headline } from "@/lib/fonts";
import { OnboardingWizard } from "@/components/organization/onboarding-wizard";
import { SignOutButton } from "@/components/shared/auth/sign-out-button";

export const metadata: Metadata = {
  title: "Organization Setup | Dropwell",
  description: "Create or join an organization to start managing shipments and rates.",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  // If user already belongs to an organization, send them to their dashboard
  if (profile.organizationId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-10">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <Logo size={42} />
          <span className={`${headline.className} text-xl font-bold tracking-tight text-foreground`}>
            {BRAND}
          </span>
        </div>

        <SignOutButton />
      </header>

      {/* Main Form Body */}
      <div className="flex-1 flex items-center justify-center py-12">
        <OnboardingWizard
          userName={profile.name}
          userEmail={profile.email}
        />
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground max-w-4xl w-full mx-auto pt-6 border-t border-border/50">
        <p>
          &copy; {new Date().getFullYear()} {BRAND}. All rights reserved. Secure enterprise workspace access.
        </p>
      </footer>
    </main>
  );
}
