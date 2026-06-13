"use client";

import React, { useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { getPredictionPoolAddress, PREDICTION_POOL_ABI } from "@/shared/lib/contracts";
import { StatusBadge, PoolStatus } from "@/shared/ui/StatusBadge";
import { LiveStakeBar } from "@/features/pools/components/LiveStakeBar";
import { StakePanel } from "@/features/staking/components/StakePanel";
import Link from "next/link";

export default function PoolDetail({ params }: { params: { id: string } }) {
  const poolId = params.id as `0x${string}`;
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);

  // 1. Fetch Pool Details
  const { data: poolData, isLoading: isPoolLoading, refetch: refetchPool } = useReadContract({
    address: getPredictionPoolAddress() as `0x${string}`,
    abi: PREDICTION_POOL_ABI,
    functionName: "pools",
    args: [poolId],
  });

  // 2. Fetch Option Labels
  const { data: optionsData, isLoading: isOptionsLoading, refetch: refetchOptions } = useReadContract({
    address: getPredictionPoolAddress() as `0x${string}`,
    abi: PREDICTION_POOL_ABI,
    functionName: "getPoolOptions",
    args: [poolId],
  });

  const optionsArray = (optionsData || []) as string[];

  // 3. Fetch Option Totals
  const { data: totalsData, refetch: refetchTotals } = useReadContracts({
    contracts: optionsArray.map((_, idx) => ({
      address: getPredictionPoolAddress() as `0x${string}`,
      abi: PREDICTION_POOL_ABI,
      functionName: "optionTotals",
      args: [poolId, idx],
    })),
    query: { enabled: optionsArray.length > 0 },
  });

  const refetchAll = () => {
    refetchPool();
    refetchOptions();
    refetchTotals();
  };

  if (isPoolLoading || isOptionsLoading) {
    return (
      <main className="app-main" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px", fontFamily: "var(--font-mono)" }}>
        <div style={{ color: "var(--muted)" }}>LOADING POOL DETAILS...</div>
      </main>
    );
  }

  const poolDetails = poolData as readonly unknown[];
  const hasPool = poolDetails && (poolDetails[0] as string) !== "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (!hasPool) {
    return (
      <main className="app-main">
        <div style={{ textAlign: "center", padding: "64px 32px", border: "2px solid var(--border)", background: "var(--surface)" }}>
          <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>PREDICTION POOL NOT FOUND</h3>
          <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "20px" }}>The pool you are trying to access does not exist on-chain.</p>
          <Link href="/" className="btn btn-primary">Back to Feed</Link>
        </div>
      </main>
    );
  }

  const totalPoolRaw = poolDetails[8] as bigint;
  const totalPool = Number(totalPoolRaw) / 10 ** 6;

  // Construct options with live data
  const mappedOptions = optionsArray.map((label, idx) => {
    const totalStakedRaw = (totalsData?.[idx]?.result as bigint) ?? BigInt(0);
    const totalStaked = Number(totalStakedRaw) / 10 ** 6;
    const percentage = totalPool > 0 ? Number(((totalStaked / totalPool) * 100).toFixed(1)) : 0;
    const odds = totalStaked > 0 ? `${(totalPool / totalStaked).toFixed(2)}x` : "1.00x";
    
    return {
      label,
      percentage,
      totalStakedStr: `$${totalStaked.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
      stakers: 0,
      odds: `${odds} odds`,
      totalStakedRaw,
    };
  });

  const statusMap = ["open", "locked", "resolving", "settled"];
  const statusUint = poolDetails[7] as number;
  const status = (statusMap[statusUint] || "open") as PoolStatus;

  // Calculate time remaining (single large number + unit, e.g. "14h" or "2d" or "Closed")
  const stakeDeadline = Number(poolDetails[2] as bigint);
  const now = Math.floor(Date.now() / 1000);
  const diffSecs = stakeDeadline - now;
  let timeLeft = "CLOSED";
  if (diffSecs > 0) {
    const days = Math.floor(diffSecs / (24 * 3600));
    const hours = Math.floor((diffSecs % (24 * 3600)) / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    if (days > 0) {
      timeLeft = `${days}d`;
    } else if (hours > 0) {
      timeLeft = `${hours}h`;
    } else {
      timeLeft = `${mins}m`;
    }
  }

  return (
    <main className="app-main">
      {/* Breadcrumb */}
      <div style={{ marginBottom: "24px" }}>
        <Link href="/" style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)", fontFamily: "var(--font-mono)", textDecoration: "none" }}>
          ← BACK TO FEED
        </Link>
      </div>

      {/* Hero Header: question fills top ~30% of viewport, inline status, large countdown */}
      <div className="pool-detail-hero" style={{ borderBottom: "2px solid var(--border)", paddingBottom: "32px", marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "32px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                MARKET RESOLUTION
              </span>
              <StatusBadge status={status} />
            </div>
            <h1 className="pool-detail-question" style={{ margin: 0 }}>
              {poolDetails[1] as string}
            </h1>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
              TIME REMAINING
            </div>
            <div className="pool-detail-countdown">
              {timeLeft}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details left, Staking panel right */}
      <div className="pool-detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Redeemed Stake Bar */}
          <div>
            <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
              Live Staking Distribution
            </div>
            <LiveStakeBar options={mappedOptions} status={status} />
          </div>

          {/* Option Selector List */}
          <div>
            <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "16px" }}>
              OUTCOME SELECTION
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {mappedOptions.map((opt, idx) => {
                const isSelected = selectedOptionIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => status === "open" && setSelectedOptionIdx(idx)}
                    style={{
                      border: isSelected ? "2px solid var(--accent)" : "2px solid var(--border)",
                      background: isSelected ? "var(--accent-soft)" : "var(--surface)",
                      padding: "16px 20px",
                      cursor: status === "open" ? "pointer" : "default",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid var(--border)",
                        background: isSelected ? "var(--accent)" : "transparent",
                        display: "grid",
                        placeItems: "center"
                      }}>
                        {isSelected && <span style={{ color: "#FFF", fontSize: "10px" }}>✓</span>}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "14px" }}>{opt.label}</span>
                    </div>

                    <div style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
                      <span>{opt.percentage}% SHARE</span>
                      <span style={{ color: "var(--accent)", fontWeight: 700 }}>{opt.odds}</span>
                      <span style={{ color: "var(--muted)" }}>{opt.totalStakedStr} STAKED</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meta specs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", border: "2px solid var(--border)", padding: "24px", background: "var(--surface)" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--muted)" }}>POOL ADDRESS</div>
              <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", wordBreak: "break-all", marginTop: "4px" }}>{poolId}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--muted)" }}>TOTAL TELEMETRY POOL</div>
              <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "4px", color: "var(--accent)" }}>
                ${totalPool.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Staking Panel */}
        <div>
          <StakePanel
            poolId={poolId}
            options={mappedOptions}
            selectedOptionIdx={selectedOptionIdx}
            setSelectedOptionIdx={setSelectedOptionIdx}
            totalPool={totalPool}
            refetch={refetchAll}
            question={poolDetails[1] as string}
            optionsLabels={optionsArray}
          />
        </div>
      </div>
    </main>
  );
}
