import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 border border-destructive/20 bg-destructive/10 p-2.5 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
