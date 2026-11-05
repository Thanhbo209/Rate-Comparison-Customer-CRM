import { cn } from "cn";

export function HeaderCell({
  en,
  align = "left",
  className,
}: {
  en: string;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-2.5 align-bottom",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      <span className="block text-xs font-semibold text-foreground">{en}</span>
    </th>
  );
}
