"use client";

import { useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Ticket,
  Copy,
  Check,
  Trash2,
  Clock,
  AlertCircle,
  MoreVertical,
  UserMinus,
  ArrowUpDown,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  generateInvitationAction,
  revokeInvitationAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "@/lib/organization/actions";
import type {
  OrganizationTeamData,
  OrganizationMemberItem,
  OrganizationInvitationItem,
} from "@/lib/organization/queries";

export function MemberManagementView({
  initialData,
}: {
  initialData: OrganizationTeamData;
}) {
  const [data, setData] = useState(initialData);
  const [roleToInvite, setRoleToInvite] = useState<"SALES" | "SALES_MANAGER">(
    "SALES",
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<{
    code: string;
    expiresAt: Date;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const isManager = data.isManager;

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  }

  function handleGenerateInvitation() {
    setFeedback(null);
    startTransition(async () => {
      const res = await generateInvitationAction({
        role: roleToInvite,
        expiresInDays: 7,
      });

      if (!res.success || !res.data) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to generate invitation code.",
        });
        return;
      }

      setGeneratedInvite({
        code: res.data.code,
        expiresAt: new Date(res.data.expiresAt),
      });

      // Update local invitations list optimistically
      const newInv: OrganizationInvitationItem = {
        id: Math.random().toString(),
        code: res.data.code,
        role: roleToInvite,
        expiresAt: new Date(res.data.expiresAt),
        createdAt: new Date(),
        usedAt: null,
        createdBy: { id: "me", name: "You" },
        usedBy: null,
        isExpired: false,
        isUsed: false,
      };

      setData((prev) => ({
        ...prev,
        invitations: [newInv, ...prev.invitations],
      }));

      setFeedback({
        type: "success",
        message: `New invitation code generated! Share it with your team member.`,
      });
    });
  }

  function handleRevokeInvitation(invitationId: string) {
    if (!confirm("Are you sure you want to revoke this invitation code?"))
      return;

    setFeedback(null);
    startTransition(async () => {
      const res = await revokeInvitationAction({ invitationId });
      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to revoke invitation.",
        });
        return;
      }

      setData((prev) => ({
        ...prev,
        invitations: prev.invitations.filter((inv) => inv.id !== invitationId),
      }));

      setFeedback({
        type: "success",
        message: "Invitation revoked successfully.",
      });
    });
  }

  function handleToggleRole(member: OrganizationMemberItem) {
    const nextRole: "SALES" | "SALES_MANAGER" =
      member.role === "SALES_MANAGER" ? "SALES" : "SALES_MANAGER";

    setFeedback(null);
    startTransition(async () => {
      const res = await updateMemberRoleAction({
        targetUserId: member.id,
        newRole: nextRole,
      });

      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to update member role.",
        });
        return;
      }

      setData((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === member.id ? { ...m, role: nextRole } : m,
        ),
      }));

      setFeedback({
        type: "success",
        message: `${member.name}'s role updated to ${nextRole === "SALES_MANAGER" ? "Sales Manager" : "Sales"}.`,
      });
    });
  }

  function handleRemoveMember(member: OrganizationMemberItem) {
    if (
      !confirm(
        `Are you sure you want to remove ${member.name} from the organization? They will lose access to team resources.`,
      )
    ) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await removeMemberAction({ targetUserId: member.id });
      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to remove member.",
        });
        return;
      }

      setData((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== member.id),
      }));

      setFeedback({
        type: "success",
        message: `${member.name} has been removed from the organization.`,
      });
    });
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary">
              • {data.organization?.name}
            </span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Team & Member Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organization members, assign roles, and create single-use
            invitation codes.
          </p>
        </div>

        {isManager && (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerateInvitation}
              disabled={isPending}
              className="gap-2"
            >
              <Ticket className="size-4" />
              <span>Generate Invitation Code</span>
            </Button>
          </div>
        )}
      </div>

      {/* Global feedback banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium ${
            feedback.type === "success"
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="hover:opacity-75"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Members
            </span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {data.members.length}
            </span>
            <span className="text-xs text-muted-foreground">in workspace</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Active Invitations
            </span>
            <Ticket className="size-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {data.invitations.filter((i) => !i.isUsed && !i.isExpired).length}
            </span>
            <span className="text-xs text-muted-foreground">pending usage</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Your Permission
            </span>
            <Shield className="size-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              {data.isManager ? "Sales Manager" : "Sales Member"}
            </span>
          </div>
        </div>
      </div>

      {/* Active Newly Generated Invitation Alert */}
      {generatedInvite && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Invitation Code Ready
              </span>
              <h3 className="text-base font-semibold text-foreground">
                Share this secure code with your invitee
              </h3>
              <p className="text-xs text-muted-foreground">
                This code is single-use and will expire in 7 days (
                {generatedInvite.expiresAt.toLocaleDateString()}).
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGeneratedInvite(null)}
              className="text-xs text-muted-foreground"
            >
              Dismiss
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl border border-border bg-background px-4 py-3 font-mono text-base font-bold tracking-wider text-foreground">
              {generatedInvite.code}
            </div>
            <Button
              onClick={() => copyToClipboard(generatedInvite.code)}
              className="h-12 px-5 gap-2"
            >
              {copiedCode === generatedInvite.code ? (
                <>
                  <Check className="size-4 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Copy Code</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="border-b border-border/80 p-5 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Organization Members
            </h2>
            <p className="text-xs text-muted-foreground">
              All teammates currently assigned to {data.organization?.name}.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground">
              <tr>
                <th className="py-3 px-5 font-medium">Member</th>
                <th className="py-3 px-5 font-medium">Role</th>
                <th className="py-3 px-5 font-medium">Joined Date</th>
                {isManager && (
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {data.members.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{member.name}</span>
                          {member.isCurrentUser && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        member.role === "SALES_MANAGER"
                          ? "bg-primary/15 text-primary font-semibold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {member.role === "SALES_MANAGER" && (
                        <Shield className="size-3" />
                      )}
                      {member.role === "SALES_MANAGER"
                        ? "Sales Manager"
                        : "Sales"}
                    </span>
                  </td>

                  <td className="py-4 px-5 text-muted-foreground font-mono">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>

                  {isManager && (
                    <td className="py-4 px-5 text-right">
                      {!member.isCurrentUser ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleToggleRole(member)}
                            className="h-8 text-xs gap-1.5"
                          >
                            <ArrowUpDown className="size-3" />
                            <span>
                              {member.role === "SALES_MANAGER"
                                ? "Demote to Sales"
                                : "Promote to Manager"}
                            </span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleRemoveMember(member)}
                            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          Current session
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invitations Section (Manager only) */}
      {isManager && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="border-b border-border/80 p-5 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Organization Invitations
              </h2>
              <p className="text-xs text-muted-foreground">
                Single-use invitation codes generated for team onboarding.
              </p>
            </div>
          </div>

          {data.invitations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No invitation codes have been generated yet. Click &quot;Generate
              Invitation Code&quot; above to invite members.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground">
                  <tr>
                    <th className="py-3 px-5 font-medium">Code</th>
                    <th className="py-3 px-5 font-medium">Target Role</th>
                    <th className="py-3 px-5 font-medium">Created By</th>
                    <th className="py-3 px-5 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium">Expires At</th>
                    <th className="py-3 px-5 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-foreground">
                  {data.invitations.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold tracking-wider text-foreground">
                          {inv.code}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {inv.role === "SALES_MANAGER"
                            ? "Sales Manager"
                            : "Sales"}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-muted-foreground">
                        {inv.createdBy.name}
                      </td>

                      <td className="py-4 px-5">
                        {inv.isUsed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                            <Check className="size-3" />
                            Redeemed {inv.usedBy ? `(${inv.usedBy.name})` : ""}
                          </span>
                        ) : inv.isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            <Clock className="size-3" />
                            Active (Unused)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-muted-foreground font-mono">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-5 text-right">
                        {!inv.isUsed && !inv.isExpired && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(inv.code)}
                              className="h-8 text-xs gap-1"
                            >
                              {copiedCode === inv.code ? (
                                <Check className="size-3 text-emerald-500" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                              <span>Copy</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleRevokeInvitation(inv.id)}
                              className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
