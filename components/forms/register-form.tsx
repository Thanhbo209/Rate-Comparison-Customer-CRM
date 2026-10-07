"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const RESEND_SECONDS = 60;

type Errors = {
  name?: string;
  organizationName?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");

  // Confirmation state
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Countdown for the "Resend email" button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (organizationName.trim().length < 2)
      next.organizationName = "Enter your organization name.";
    if (!/^\S+@\S+\.\S+$/.test(email))
      next.email = "Enter a valid email address.";
    if (password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    if (!terms) next.terms = "You need to accept the terms to continue.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Where the link in the confirmation email sends the user
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        // Saved as user metadata (user_metadata / raw_user_meta_data)
        data: {
          full_name: name.trim(),
          organization_name: organizationName.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    // For an email that is already registered, Supabase returns a user with no identities
    if (data.user && data.user.identities?.length === 0) {
      setFormError(
        "An account with this email already exists. Try logging in instead.",
      );
      return;
    }

    // Email confirmation turned off in Supabase: the user is already signed in
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    // Email confirmation turned on: show the "check your email" message
    setCooldown(RESEND_SECONDS);
    setSuccess(true);
  }

  async function handleResend() {
    setResending(true);
    setResendMessage("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });

    setResending(false);

    if (error) {
      setResendMessage(error.message);
      return;
    }
    setResendMessage("We sent the email again.");
    setCooldown(RESEND_SECONDS);
  }

  async function handleGoogle() {
    setFormError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setFormError(error.message);
    }
  }

  /* ───────────── Confirmation state ───────────── */
  if (success) {
    return (
      <div aria-live="polite">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M4 8l8 6 8-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="break-all font-medium text-foreground">{email}</span>
          . Open it to activate your account.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Can&apos;t see it? Check your spam folder.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "lg" }), "h-11 w-full")}
          >
            Back to login
          </Link>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
          >
            {resending
              ? "Sending…"
              : cooldown > 0
                ? `Resend email in ${cooldown}s`
                : "Resend email"}
          </Button>

          {resendMessage && (
            <p
              role="status"
              className="text-center text-sm text-muted-foreground"
            >
              {resendMessage}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            Go back and change it
          </button>
        </p>
      </div>
    );
  }

  /* ───────────── Sign-up form ───────────── */
  return (
    <>
      <h1 className="font-heading text-4xl font-bold tracking-tight">
        Create your account
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          Log in
        </Link>
        . It&apos;s free and takes under a minute.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="h-11"
          />
          <FieldError id="name-error" message={errors.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization name</Label>
          <Input
            id="organizationName"
            autoComplete="organization"
            placeholder="Your company or organization"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            aria-invalid={!!errors.organizationName}
            aria-describedby={
              errors.organizationName ? "organizationName-error" : undefined
            }
            className="h-11"
          />
          <FieldError
            id="organizationName-error"
            message={errors.organizationName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-11"
          />
          <FieldError id="email-error" message={errors.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="h-11 pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide passwords" : "Show passwords"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <FieldError id="password-error" message={errors.password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
            className="h-11"
          />
          <FieldError id="confirm-error" message={errors.confirm} />
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-input accent-primary"
            />
            <Label
              htmlFor="terms"
              className="block text-sm font-normal leading-snug"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-medium underline underline-offset-2 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium underline underline-offset-2 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </Label>
          </div>
          <FieldError id="terms-error" message={errors.terms} />
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-full gap-3"
        onClick={handleGoogle}
      >
        <FcGoogle size={18} />
        Sign up with Google
      </Button>
    </>
  );
}
