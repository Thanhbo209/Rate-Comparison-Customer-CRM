"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  variant = "ghost",
  className = "",
}: {
  variant?: "ghost" | "outline" | "default" | "secondary" | "destructive" | "link";
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleSignOut}
      disabled={isPending}
      className={`text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 ${className}`}
    >
      <LogOut className="size-3.5" />
      <span>{isPending ? "Signing out..." : "Sign out"}</span>
    </Button>
  );
}
