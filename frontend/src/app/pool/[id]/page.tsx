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

  // 3. Fetch Option Totals (Multicall)
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
      <main className="app-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ color: 'var(--muted)' }}>Loading prediction pool details...</div>
      </main>
    );
  }

  // If pool does not exist, poolData[0] (id) will be zero bytes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasPool = poolData && (poolData as any)[0] !== "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (!hasPool) {
    return (
      <main className="app-main">
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3 style={{ color: 'var(--text)', marginBottom: '8px' }}>Prediction Pool Not Found</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>The pool you are trying to access does not exist on-chain.</p>
          <Link href="/" className="btn btn-primary">Back to Feed</Link>
        </div>
      </main>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poolDetails = poolData as any;
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

  // Calculate time remaining
  const stakeDeadline = Number(poolDetails[2]);
  const now = Math.floor(Date.now() / 1000);
  const diffSecs = stakeDeadline - now;
  let timeLeft = "Closed";
  if (diffSecs > 0) {
    const days = Math.floor(diffSecs / (24 * 3600));
    const hours = Math.floor((diffSecs % (24 * 3600)) / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    if (days > 0) {
      timeLeft = `${days}d ${hours}h ${mins}m`;
    } else if (hours > 0) {
      timeLeft = `${hours}h ${mins}m`;
    } else {
      timeLeft = `${mins}m`;
    }
  }

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
              src={`https://picsum.photos/seed/${poolId.slice(0, 10)}/1200/400`}
              alt=""
              loading="lazy"
            />
          </div>

          {/* Pool Header */}
          <h1 className="pool-header-question" style={{ fontSize: "clamp(22px, 2.4vw, 32px)", fontWeight: 700, margin: "4px 0 12px" }}>
            {poolDetails[1]}
          </h1>

          <div className="pool-header-meta" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <StatusBadge status={status} />
            <span className="countdown" style={{ padding: "4px 12px", borderRadius: "999px", background: "var(--amber-soft)", color: "var(--amber)", fontSize: "13px", fontWeight: 600 }}>⏱ {timeLeft}</span>
            <span className="pool-total-label" style={{ fontSize: "13px", color: "var(--muted)" }}>
              Total pool: <strong className="pool-total-value t-num" style={{ fontSize: "24px", color: "var(--fg)" }}>
                ${totalPool.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </strong>
            </span>
          </div>

          {/* Full stake bar */}
          <LiveStakeBar options={mappedOptions} />

          {/* Option Cards */}
          <div className="option-cards">
            {mappedOptions.map((opt, idx) => {
              const isSelected = selectedOptionIdx === idx;
              return (
                <div
                  key={idx}
                  className={`option-card ${isSelected ? "selected" : ""}`}
                  style={{ cursor: status === "open" ? "pointer" : "default" }}
                  onClick={() => status === "open" && setSelectedOptionIdx(idx)}
                >
                  <div className="option-card-check">{isSelected ? "✓" : ""}</div>
                  <div className="option-card-name">{opt.label}</div>
                  <div className="option-card-stats">
                    <span className="option-card-pct">{opt.percentage}%</span>
                    <span className="option-card-odds">{opt.odds}</span>
                    <span className="option-card-odds">{opt.totalStakedStr} staked</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: "320px", flexShrink: 0 }}>
          <StakePanel
            poolId={poolId}
            options={mappedOptions}
            selectedOptionIdx={selectedOptionIdx}
            setSelectedOptionIdx={setSelectedOptionIdx}
            totalPool={totalPool}
            refetch={refetchAll}
            question={poolDetails[1]}
            optionsLabels={optionsArray}
          />
        </div>
      </div>
    </main>
  );
}
