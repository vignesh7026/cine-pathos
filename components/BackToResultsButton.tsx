"use client";

import { useRouter } from "next/navigation";

export default function BackToResultsButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-block mb-6 text-sm text-offwhite/60 hover:text-offwhite transition"
    >
      ← back to results
    </button>
  );
}
