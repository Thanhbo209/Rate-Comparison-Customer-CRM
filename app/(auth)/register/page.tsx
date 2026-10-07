import type { Metadata } from "next";
import { BRAND, Logo } from "@/components/shared/brand";
import { AuthPanel } from "@/components/shared/auth/auth-panel";
import { RegisterForm } from "@/components/forms/register-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { headline } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create your account to track every delivery and keep customers informed.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen bg-background text-foreground">
      {/* ───────────── Register form ───────────── */}
      <section className="flex flex-1 flex-col px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="flex items-center text-primary">
          <span className="lg:hidden">
            <Logo size={80} />
          </span>
          <span
            className={`${headline.className} text-xl font-semibold text-foreground lg:text-2xl`}
          >
            {BRAND}
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {/* Back button + breadcrumb */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Register</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Only this part runs in the browser */}
          <RegisterForm />
        </div>
      </section>

      {/* ───────────── logistics panel ───────────── */}
      <AuthPanel
        lines={["Set up in minutes.", "Ship with confidence."]}
        description="Add your drivers and first orders today, and your customers start getting delivery updates right away."
      />
    </main>
  );
}
