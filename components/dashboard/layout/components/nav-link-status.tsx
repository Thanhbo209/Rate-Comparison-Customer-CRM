import { cn } from "cn";
import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";

/** Right-hand status for a link: spinner while navigating, dot when current. Hidden in the rail. */
export function NavLinkStatus({ isHighlighted }: { isHighlighted: boolean }) {
  const { pending } = useLinkStatus();

  return (
    <span
      className="flex size-4 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      {pending ? (
        <Loader2
          className={cn(
            "size-3 animate-spin",
            isHighlighted ? "text-primary-foreground" : "text-primary",
          )}
        />
      ) : isHighlighted ? (
        <span className="size-1.5 bg-primary-foreground" />
      ) : null}
    </span>
  );
}
