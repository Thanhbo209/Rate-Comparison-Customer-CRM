import Image from "next/image";

export const BRAND = "Dropwell";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/images/dropwell.png"
      alt={BRAND}
      width={size}
      height={size}
      className="h-auto shrink-0"
      priority
    />
  );
}
