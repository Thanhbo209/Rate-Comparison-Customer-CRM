"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
  variant?: "ghost" | "sidebar";
  showIcon?: boolean;
}

export function SignOutButton({
  className,
  variant = "ghost",
  showIcon = true,
}: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
      setLoading(false);
    }
  };

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
          className
        )}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          showIcon && <LogOut className="size-4 shrink-0" />
        )}
        <span>{loading ? "Signing out..." : "Sign out"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        showIcon && <LogOut className="size-3.5 shrink-0" />
      )}
      <span>{loading ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}
