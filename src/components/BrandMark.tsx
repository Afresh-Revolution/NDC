import Image from "next/image";

type Size = "sm" | "md" | "lg";

const PX: Record<Size, number> = { sm: 32, md: 48, lg: 80 };

export function BrandMark({
  size = "md",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  const px = PX[size];
  return (
    <Image
      src="/brand/ndc-logo.png"
      alt="NDC"
      width={px}
      height={px}
      className={className}
      priority={size !== "sm"}
    />
  );
}
