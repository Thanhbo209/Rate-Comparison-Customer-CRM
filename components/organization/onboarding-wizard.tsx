"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Ticket, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createOrganizationAction,
  joinOrganizationAction,
  verifyInvitationCodeAction,
} from "@/lib/organization/actions";

type Mode = "create" | "join";

export function OnboardingWizard({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");

  // Create organization state
  const [orgName, setOrgName] = useState("");
  const [createError, setCreateError] = useState("");
  const [isPendingCreate, startCreateTransition] = useTransition();

  // Join organization state
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [verifiedOrg, setVerifiedOrg] = useState<{
    organizationName: string;
    role: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPendingJoin, startJoinTransition] = useTransition();

  function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");

    if (!orgName.trim() || orgName.trim().length < 2) {
      setCreateError("Please enter an organization name (at least 2 characters).");
      return;
    }

    startCreateTransition(async () => {
      const res = await createOrganizationAction({ name: orgName });
      if (!res.success) {
        setCreateError(res.error || "Failed to create organization.");
        return;
      }

      router.push("/dashboard/sales");
      router.refresh();
    });
  }

  async function handleVerifyCode(codeToTest?: string) {
    const code = (codeToTest ?? inviteCode).trim().toUpperCase();
    if (!code) {
      setJoinError("Please enter an invitation code.");
      setVerifiedOrg(null);
      return;
    }

    setIsVerifying(true);
    setJoinError("");
    setVerifiedOrg(null);

    const res = await verifyInvitationCodeAction(code);
    setIsVerifying(false);

    if (!res.success || !res.data) {
      setJoinError(res.error || "Invalid invitation code.");
      return;
    }

    setVerifiedOrg(res.data);
  }

  function handleJoinOrg(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");

    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setJoinError("Please enter an invitation code.");
      return;
    }

    startJoinTransition(async () => {
      const res = await joinOrganizationAction({ code });
      if (!res.success) {
        setJoinError(res.error || "Failed to join organization.");
        return;
      }

      router.push("/dashboard/sales");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
          Welcome to Dropwell, {userName || "there"}!
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          To get started, create a new workspace for your company or join an
          existing team using an invitation code.
        </p>
        <p className="text-xs text-muted-foreground/80 font-mono">
          Signed in as {userEmail}
        </p>
      </div>

      {/* Mode Switch Tabs */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border">
        <button
          type="button"
          onClick={() => {
            setMode("create");
            setCreateError("");
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === "create"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="size-4" />
          <span>Create Organization</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("join");
            setJoinError("");
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === "join"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ticket className="size-4" />
          <span>Join with Code</span>
        </button>
      </div>

      {/* Mode 1: Create Organization */}
      {mode === "create" && (
        <form
          onSubmit={handleCreateOrg}
          className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Set up your organization
            </h2>
            <p className="text-xs text-muted-foreground">
              Create a dedicated workspace for your team&apos;s quotations,
              customers, and freight rate comparisons.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgName">Organization or Company Name</Label>
            <Input
              id="orgName"
              placeholder="e.g. Apex Global Logistics"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                if (createError) setCreateError("");
              }}
              disabled={isPendingCreate}
              className="h-11"
              autoFocus
            />
            {createError && (
              <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{createError}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" />
              Sales Manager Role Assigned
            </div>
            <p>
              As the creator of this organization, you will be assigned the{" "}
              <strong className="text-foreground">Sales Manager</strong> role.
              You will be able to generate invitation codes, manage team members,
              and oversee sales operations.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPendingCreate || !orgName.trim()}
            className="w-full h-11 text-sm font-medium"
          >
            {isPendingCreate ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Creating organization...
              </>
            ) : (
              <>
                Create Workspace & Continue
                <ArrowRight className="size-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* Mode 2: Join Organization */}
      {mode === "join" && (
        <form
          onSubmit={handleJoinOrg}
          className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
              <Ticket className="size-5 text-primary" />
              Enter invitation code
            </h2>
            <p className="text-xs text-muted-foreground">
              Paste the single-use invitation code provided by your organization
              manager or administrator.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invitation Code</Label>
            <div className="flex gap-2">
              <Input
                id="inviteCode"
                placeholder="e.g. INV-4A9B2C3D1E0F"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setVerifiedOrg(null);
                  if (joinError) setJoinError("");
                }}
                disabled={isPendingJoin}
                className="h-11 font-mono uppercase tracking-wider"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleVerifyCode()}
                disabled={isVerifying || isPendingJoin || !inviteCode.trim()}
                className="h-11 px-4 text-xs shrink-0"
              >
                {isVerifying ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>

            {joinError && (
              <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}
          </div>

          {verifiedOrg && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Valid Invitation
              </div>
              <p>
                You will join{" "}
                <strong className="text-foreground">
                  {verifiedOrg.organizationName}
                </strong>{" "}
                as a <strong className="text-foreground">Sales</strong> member.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" />
              Single-use & Expiring Codes
            </div>
            <p>
              Invitation codes are single-use tokens valid for 7 days. Once
              redeemed, the code cannot be reused by anyone else.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPendingJoin || !inviteCode.trim()}
            className="w-full h-11 text-sm font-medium"
          >
            {isPendingJoin ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Joining organization...
              </>
            ) : (
              <>
                Join Organization & Continue
                <ArrowRight className="size-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
