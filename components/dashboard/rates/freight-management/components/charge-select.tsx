import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CHARGE_TYPE_LABEL,
  CHARGE_TYPE_OPTIONS,
  ChargeType,
} from "@/utils/freight-management/constants";

/**
 * Classification picker (FreightItem.chargeType).
 *
 * Uses the library Select, which portals its popup to the body and layers it
 * correctly above the dialog. `alignItemWithTrigger={false}` makes it open as a
 * normal dropdown under the trigger (flipping when there's no room) instead of
 * sliding the selected item over the trigger, which is what pushes a dialog
 * around when you pick an option.
 */
export function ChargeTypeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ChargeType;
  onChange: (value: ChargeType) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (val) onChange(val as ChargeType);
      }}
    >
      <SelectTrigger
        id={id}
        className="h-10 w-full border-border bg-background text-sm"
      >
        <SelectValue placeholder="Select classification...">
          {(val: string | null) =>
            (val && CHARGE_TYPE_LABEL[val]) || "Select classification..."
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-60">
        {CHARGE_TYPE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
