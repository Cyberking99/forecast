"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";

interface StakeItem {
  id: string;
  poolId: string;
  staker: string;
  optionId: number;
  amount: string;
  txHash: string;
  createdAt: string;
  payout: string | null;
  payoutTxHash: string | null;
  pool: {
    id: string;
    question: string;
    options: string[];
    stakeDeadline: string;
    resolutionDeadline: string;
    status: string;
    winningOptionId: number | null;
    totalPool: string;
  };
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [stakes, setStakes] = useState<StakeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setStakes([]);
      return;
    }

    const fetchPortfolio = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/portfolio?address=${address}`);
        if (res.ok) {
          const json = await res.json();
          setStakes(json.stakes || []);
        }
      } catch (err) {
        console.error("Failed to load portfolio stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <main className="app-main" style={{ maxWidth: "800px", margin: "80px auto", padding: "0 16px", textAlign: "center" }}>
        <div style={{ background: "var(--surface-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "48px 32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Portfolio Locked</h2>
          <p style={{ color: "var(--muted)", marginBottom: "24px", fontSize: "14px" }}>
            Please connect your wallet using the button in the header to view your prediction dashboard.
          </p>
        </div>
      </main>
    );
  }

  // Calculate summaries
  const totalStaked = stakes.reduce((acc, curr) => acc + parseFloat(curr.amount) / 1e6, 0);
  
  // Total won: sum of (payout - amount) only for stakes where payout > amount
  const totalWon = stakes.reduce((acc, curr) => {
    if (curr.payout) {
      const payoutVal = parseFloat(curr.payout) / 1e6;
      const amountVal = parseFloat(curr.amount) / 1e6;
      if (payoutVal > amountVal) {
        return acc + (payoutVal - amountVal);
      }
    }
    return acc;
  }, 0);

  // Total lost: sum of amount for settled pools where payout is 0 or less than amount
  const totalLost = stakes.reduce((acc, curr) => {
    if (curr.pool.status === "SETTLED" || curr.pool.status === "UNRESOLVABLE") {
      const payoutVal = curr.payout ? parseFloat(curr.payout) / 1e6 : 0;
      const amountVal = parseFloat(curr.amount) / 1e6;
      if (payoutVal < amountVal) {
        return acc + (amountVal - payoutVal);
      }
    }
    return acc;
  }, 0);

  const netPl = totalWon - totalLost;

  // Filter lists
  const activeStakes = stakes.filter(s => s.pool.status !== "SETTLED" && s.pool.status !== "UNRESOLVABLE");
  const historyStakes = stakes.filter(s => s.pool.status === "SETTLED" || s.pool.status === "UNRESOLVABLE");

  return (
    <main className="app-main" style={{ maxWidth: "980px", margin: "40px auto 80px", padding: "0 16px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "24px" }}>My Portfolio</h1>

      {/* Summary Stats Cards */}
      <div className="portfolio-summary" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <div style={{ background: "var(--surface-card)", border: "1px solid var(--border)", padding: "20px 24px", borderRadius: "12px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Total Staked</div>
          <div style={{ fontSize: "24px", fontWeight: 750, marginTop: "6px" }}>${totalStaked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</div>
        </div>
        <div style={{ background: "var(--surface-card)", border: "1px solid var(--border)", padding: "20px 24px", borderRadius: "12px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Total Winnings</div>
          <div style={{ fontSize: "24px", fontWeight: 750, marginTop: "6px", color: totalWon > 0 ? "var(--green)" : "inherit" }}>
            +{totalWon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </div>
        </div>
        <div style={{ background: "var(--surface-card)", border: "1px solid var(--border)", padding: "20px 24px", borderRadius: "12px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Net P&amp;L</div>
          <div style={{ fontSize: "24px", fontWeight: 750, marginTop: "6px", color: netPl > 0 ? "var(--green)" : netPl < 0 ? "var(--red)" : "inherit" }}>
            {netPl >= 0 ? "+" : ""}{netPl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ display: "flex", gap: "16px", borderBottom: "1.5px solid var(--border)", marginBottom: "24px", paddingBottom: "4px" }}>
        <button
          className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
          style={{
            background: "none",
            border: "none",
            fontSize: "15px",
            fontWeight: 650,
            padding: "8px 16px",
            color: activeTab === "active" ? "var(--accent)" : "var(--muted)",
            borderBottom: activeTab === "active" ? "3px solid var(--accent)" : "3px solid transparent",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          Active Positions ({activeStakes.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
          style={{
            background: "none",
            border: "none",
            fontSize: "15px",
            fontWeight: 650,
            padding: "8px 16px",
            color: activeTab === "history" ? "var(--accent)" : "var(--muted)",
            borderBottom: activeTab === "history" ? "3px solid var(--accent)" : "3px solid transparent",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          Settlement History ({historyStakes.length})
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>
          <span className="status-spin" style={{ display: "inline-block", marginRight: "8px" }}></span> Loading portfolio...
        </div>
      ) : activeTab === "active" ? (
        activeStakes.length === 0 ? (
          <div style={{ padding: "64px 32px", border: "1.5px dashed var(--border)", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>You do not have any active prediction stakes.</p>
            <Link href="/" className="btn btn-primary" style={{ display: "inline-flex" }}>Browse Markets</Link>
          </div>
        ) : (
          <div>
            {activeStakes.map((stake) => {
              const amountUSDC = parseFloat(stake.amount) / 1e6;
              const poolTotalUSDC = parseFloat(stake.pool.totalPool) / 1e6;
              const poolShare = poolTotalUSDC > 0 ? (amountUSDC / poolTotalUSDC) * 100 : 0;
              const selectedOptionName = stake.pool.options[stake.optionId] || `Option ${stake.optionId}`;

              return (
                <Link key={stake.id} href={`/pool/${stake.poolId}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="position-card" style={{ display: "flex", alignItems: "center", background: "var(--surface-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", marginBottom: "12px", cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>{stake.pool.question}</div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span>Staked <strong>${amountUSDC.toFixed(2)} USDC</strong> on <strong>{selectedOptionName}</strong></span>
                        <span className={`status-badge ${stake.pool.status.toLowerCase()}`}>
                          <span className={`${stake.pool.status === "LOCKED" ? "status-spin" : "status-dot"}`}></span>
                          {stake.pool.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", paddingLeft: "24px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 750 }}>${amountUSDC.toFixed(2)}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{poolShare.toFixed(1)}% pool share</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : historyStakes.length === 0 ? (
        <div style={{ padding: "64px 32px", border: "1.5px dashed var(--border)", borderRadius: "12px", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>No past prediction payouts recorded.</p>
        </div>
      ) : (
        <div>
          {historyStakes.map((stake) => {
            const amountUSDC = parseFloat(stake.amount) / 1e6;
            const payoutVal = stake.payout ? parseFloat(stake.payout) / 1e6 : 0;
            const isWinner = payoutVal > amountUSDC;
            const isRefund = stake.pool.status === "UNRESOLVABLE";
            const selectedOptionName = stake.pool.options[stake.optionId] || `Option ${stake.optionId}`;
            const winningOptionName = stake.pool.winningOptionId !== null ? (stake.pool.options[stake.pool.winningOptionId] || `Option ${stake.pool.winningOptionId}`) : "N/A";

            let plString = "";
            let plColor = "inherit";

            if (isRefund) {
              plString = "Refunded";
              plColor = "var(--muted)";
            } else if (isWinner) {
              plString = `+$${(payoutVal - amountUSDC).toFixed(2)}`;
              plColor = "var(--green)";
            } else {
              plString = `-$${amountUSDC.toFixed(2)}`;
              plColor = "var(--red)";
            }

            return (
              <Link key={stake.id} href={`/pool/${stake.poolId}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="position-card" style={{ display: "flex", alignItems: "center", background: "var(--surface-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", marginBottom: "12px", cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>{stake.pool.question}</div>
                    <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                      Staked <strong>${amountUSDC.toFixed(2)} USDC</strong> on <strong>{selectedOptionName}</strong> ·
                      {isRefund ? (
                        <span style={{ marginLeft: "6px" }}>Pool unresolved (Refunded)</span>
                      ) : (
                        <span style={{ marginLeft: "6px" }}>
                          Winning outcome: <strong style={{ color: "var(--accent)" }}>{winningOptionName}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", paddingLeft: "24px" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: plColor }}>{plString}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      payout: ${payoutVal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
