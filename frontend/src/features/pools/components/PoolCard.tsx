import React from "react";
import { StatusBadge, PoolStatus } from "@/shared/ui/StatusBadge";
import Link from "next/link";

interface Option {
  label: string;
  percentage: number;
  totalStakedStr: string;
  stakers: number;
}

export interface PoolCardProps {
  id: string;
  question: string;
  category: string;
  status: PoolStatus;
  thumbnailUrl: string;
  poolTotal: string;
  timeLeft: string;
  totalStakers: number;
  options: Option[];
}

export function PoolCard({
  id,
  question,
  status,
  thumbnailUrl,
  poolTotal,
  timeLeft,
  totalStakers,
  options,
}: PoolCardProps) {
  return (
    <Link href={`/pool/${id}`} className="pool-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div className="pool-card-row">
        <div className="pool-card-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnailUrl} alt="" loading="lazy" />
        </div>
        <div className="pool-card-body">
          <div className="pool-card-header" style={{ marginBottom: "8px" }}>
            <span className="pool-card-question">{question}</span>
            <StatusBadge status={status} />
          </div>
          <div className="stake-bar">
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
                <span className="stake-bar-segment-label">
                  {opt.percentage}% {opt.label}
                </span>
                <div className="stake-bar-tooltip">
                  {opt.totalStakedStr} · {opt.stakers} stakers
                </div>
              </div>
            ))}
          </div>
          <div className="pool-card-meta">
            <span>💰 {poolTotal} pool</span>
            <span style={status === 'open' && timeLeft.includes('h') && !timeLeft.includes('d') ? { color: "var(--amber)", fontWeight: 600 } : {}}>
              ⏱ {timeLeft} left
            </span>
            <span>👥 {totalStakers} stakers</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
