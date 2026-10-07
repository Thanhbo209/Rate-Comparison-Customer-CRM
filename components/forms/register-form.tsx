"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Errors = {
  name?: string;
  organizationName?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
};

export function RegisterForm() {
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

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
    // TODO: call your register API here
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
  }

  function handleGoogle() {
    // TODO: connect Google sign-up here
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
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
          {errors.name && (
            <p
              id="name-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.name}
            </p>
          )}
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
          {errors.organizationName && (
            <p
              id="organizationName-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.organizationName}
            </p>
          )}
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
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.email}
            </p>
          )}
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
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.password}
            </p>
          )}
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
          {errors.confirm && (
            <p
              id="confirm-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.confirm}
            </p>
          )}
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
          {errors.terms && (
            <p
              id="terms-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.terms}
            </p>
          )}
        </div>

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
