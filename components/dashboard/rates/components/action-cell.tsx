import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { Layers, Trash2 } from "lucide-react";
import { COL } from "./charge-cell";

export function ActionsCell({
  providerName,
  onManage,
  onDelete,
}: {
  providerName: string;
  onManage: () => void;
  onDelete: () => void;
}) {
  return (
    <td className={cn("px-4 py-4 align-top", COL.groupStart)}>
      <div className="flex items-center justify-end gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={onManage}
          className="h-7 gap-1 px-2.5 text-xs"
        >
          <Layers className="size-3" />
          Manage items
        </Button>
        <Button
          type="button"
          variant={"ghost"}
          onClick={onDelete}
          aria-label={`Delete quote option for ${providerName}`}
          title="Delete quote option"
          className={cn(
            "p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            // Hidden until the row is hovered or focused; always visible on touch devices.
          )}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </td>
  );
}
