import { NavConfigItem } from "@/utils/layouts/sidebar/constants";
import { cn } from "cn";
import Link from "next/link";
import { NavIcon } from "./nav.icons";
import { NavLinkStatus } from "./nav-link-status";

export function NavItem({
  item,
  rail,
  isCurrent,
  isHighlighted,
  onClick,
}: {
  item: NavConfigItem;
  rail: boolean;
  isCurrent: boolean;
  isHighlighted: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const Icon = item.icon;
  const label = (
    <span
      className={cn(
        "truncate whitespace-nowrap transition-opacity duration-150",
        rail && "opacity-0",
      )}
    >
      {item.label}
    </span>
  );

  if (item.badge) {
    return (
      <div
        title={rail ? `${item.label} (coming soon)` : undefined}
        className="flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground/70 transition-colors"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="size-4 shrink-0 text-muted-foreground/50" />
          {label}
        </div>
        {!rail && (
          <span className="bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            {item.badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || "#"}
      onClick={onClick}
      aria-current={isCurrent ? "page" : undefined}
      title={rail ? item.label : undefined}
      className={cn(
        "flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors",
        isHighlighted
          ? "bg-primary font-semibold text-primary-foreground shadow-xs"
          : "text-foreground/80 hover:bg-muted hover:text-foreground",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <NavIcon icon={Icon} isHighlighted={isHighlighted} rail={rail} />
        {label}
      </div>
      {!rail && <NavLinkStatus isHighlighted={isHighlighted} />}
    </Link>
  );
}
