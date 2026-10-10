"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  warningContent?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  onConfirm: () => Promise<{ success: boolean; error?: string } | void>;
  successMessage?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  warningContent,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive",
  onConfirm,
  successMessage,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ignore close attempts (Esc, backdrop, buttons) while action is running
  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return;
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await onConfirm();
      if (res && res.success === false) {
        // Server returned an error: keep dialog open and display error inside
        setError(res.error || "An unexpected error occurred. Please try again.");
        setLoading(false);
        return;
      }

      // Success
      setLoading(false);
      setError(null);
      onOpenChange(false);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (err) {
      // In case onConfirm threw an error: keep dialog open and display error inside
      console.error("ConfirmDialog onConfirm error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onClose={() => handleOpenChange(false)}
        className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={
                variant === "destructive"
                  ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
                  : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
              }
            >
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
          {warningContent}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-5 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleOpenChange(false)}
            className="h-9 px-4 text-xs font-medium"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={loading}
            onClick={handleConfirm}
            className="h-9 gap-1.5 px-4 text-xs font-medium shadow-xs"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
