"use client";

import { useState } from "react";

export function CopyAccount({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      className="pay-copy"
      onClick={copy}
      aria-label={copied ? "Account number copied" : `Copy account number ${value}`}
    >
      <span className="mono pay-account">{value}</span>
      <span className="pay-copy-hint">{copied ? "Copied" : "Tap to copy"}</span>
    </button>
  );
}
