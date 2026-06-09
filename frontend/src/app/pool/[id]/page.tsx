import React from "react";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { LiveStakeBar } from "@/features/pools/components/LiveStakeBar";
import { StakePanel } from "@/features/staking/components/StakePanel";
import Link from "next/link";

export default function PoolDetail({ params }: { params: { id: string } }) {
  // Mock data for the specific pool
  const pool = {
    id: params.id,
    question: "Will Real Madrid win the 2026 Champions League final?",
    status: "open" as const,
    timeLeft: "14d 6h 42m",
    poolTotal: "$201.0K",
    options: [
      {
        label: "Yes — Real Madrid wins",
        percentage: 62.1,
        totalStakedStr: "$124.8K",
        stakers: 431,
        odds: "1.6x odds",
      },
      {
        label: "No — any other team wins",
        percentage: 37.9,
        totalStakedStr: "$76.2K",
        stakers: 284,
        odds: "2.6x odds",
      },
    ],
  };

  return (
    <main className="app-main">
      <div className="pool-detail-layout" style={{ display: 'flex', gap: '24px' }}>
        {/* Left / Main column */}
        <div className="pool-detail-main" style={{ flex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: "12px" }}>
            <Link href="/" style={{ fontSize: "13px", color: "var(--muted)" }}>
              ← Back to Feed
            </Link>
          </div>

          {/* Hero image */}
          <div className="pool-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://picsum.photos/seed/realmadrid-hero/1200/400"
              alt=""
              loading="lazy"
            />
          </div>

          {/* Pool Header */}
          <h1 className="pool-header-question" style={{ fontSize: "clamp(22px, 2.4vw, 32px)", fontWeight: 700, margin: "4px 0 12px" }}>{pool.question}</h1>

          <div className="pool-header-meta" style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
            <StatusBadge status={pool.status} />
            <span className="countdown" style={{ padding: "4px 12px", borderRadius: "999px", background: "var(--amber-soft)", color: "var(--amber)", fontSize: "13px", fontWeight: 600 }}>⏱ {pool.timeLeft}</span>
            <span className="pool-total-label" style={{ fontSize: "13px", color: "var(--muted)" }}>
              Total pool: <strong className="pool-total-value t-num" style={{ fontSize: "24px", color: "var(--fg)" }}>{pool.poolTotal}</strong>
            </span>
          </div>

          {/* Full stake bar */}
          <LiveStakeBar options={pool.options} />

          {/* Option Cards */}
          <div className="option-cards">
            {pool.options.map((opt, idx) => (
              <div key={idx} className="option-card">
                <div className="option-card-check">✓</div>
                <div className="option-card-name">{opt.label}</div>
                <div className="option-card-stats">
                  <span className="option-card-pct">{opt.percentage}%</span>
                  <span className="option-card-odds">{opt.odds}</span>
                  <span className="option-card-odds">{opt.totalStakedStr} staked</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: "320px", flexShrink: 0 }}>
          <StakePanel />
        </div>
      </div>
    </main>
  );
}
