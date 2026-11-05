import { cn } from "cn";
import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";

/** The link's icon. In the rail there is no room for the status slot, so the spinner replaces the icon. */
export function NavIcon({
  icon: Icon,
  isHighlighted,
  rail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  isHighlighted: boolean;
  rail: boolean;
}) {
  const { pending } = useLinkStatus();
  const tone = isHighlighted
    ? "text-primary-foreground"
    : "text-muted-foreground";

  if (rail && pending) {
    return <Loader2 className={cn("size-4 shrink-0 animate-spin", tone)} />;
  }
  return <Icon className={cn("size-4 shrink-0", tone)} />;
}
