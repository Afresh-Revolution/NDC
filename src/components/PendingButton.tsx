"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({
  children,
  pendingLabel,
  variant = "solid",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "solid" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={variant === "ghost" ? "btn ghost" : "btn"}
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
