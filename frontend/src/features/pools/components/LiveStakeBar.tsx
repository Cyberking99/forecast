"use client";

import React from "react";

interface LiveStakeBarProps {
  options: {
    label: string;
    percentage: number;
    totalStakedStr: string;
    stakers: number;
    odds: string;
  }[];
}

export function LiveStakeBar({ options }: LiveStakeBarProps) {
  // In Phase 4, this component will use Wagmi to poll for real-time updates
  return (
    <div className="stake-bar" style={{ height: "36px", marginBottom: "20px" }}>
      {options.map((opt, idx) => (
        <div
          key={idx}
          className="stake-bar-segment"
          style={{ width: `${opt.percentage}%` }}
        >
          <div
            className="stake-bar-segment-bar"
            style={{ background: idx === 0 ? "var(--accent)" : "var(--muted)" }}
          ></div>
          <span className="stake-bar-segment-label" style={{ fontSize: "14px" }}>
            {opt.percentage}% · {opt.label}
          </span>
          <div className="stake-bar-tooltip">
            {opt.totalStakedStr} · {opt.stakers} stakers · {opt.odds}
          </div>
        </div>
      ))}
    </div>
  );
}
