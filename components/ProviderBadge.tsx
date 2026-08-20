"use client";

import { useState } from "react";

interface ProviderBadgeProps {
  logoPath: string;
  providerName: string;
}

export default function ProviderBadge({ logoPath, providerName }: ProviderBadgeProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
      {!hidden && (
        <img
          src={`https://image.tmdb.org/t/p/original${logoPath}`}
          alt={providerName}
          className="w-5 h-5 rounded"
          onError={() => setHidden(true)}
        />
      )}
      {providerName}
    </span>
  );
}