"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";

export function StakePanel() {
  const [selectedOption] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const { isConnected } = useAccount();

  // Mock calculation - In a real scenario, this would use Wagmi data
  const impliedOdds = selectedOption && amount ? "2.4x" : "—";
  const projectedShare = selectedOption && amount ? `$${(parseFloat(amount) * 2.4).toFixed(2)}` : "$0.00";

  return (
    <aside className="pool-detail-sidebar">
      <div className="stake-panel">
        <div className="stake-panel-header">Place Your Stake</div>

        <div className="stake-option-label">
          Selected option: <strong>{selectedOption || "—"}</strong>
        </div>

        <div className="stake-input-wrap">
          <input
            className="stake-input"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="stake-input-suffix">USDC</span>
        </div>

        <div className="stake-live-feedback">
          <div>
            Your share if you win: <strong className="stake-share t-num">{projectedShare}</strong>
          </div>
          <div>
            Your implied odds: <strong className="stake-odds t-num">{impliedOdds}</strong>
          </div>
        </div>

        <button 
          className="btn btn-primary btn-full stake-btn" 
          disabled={!isConnected || !selectedOption || !amount}
        >
          {!isConnected ? "Connect Wallet to Stake" : !selectedOption ? "Select an option to stake" : "Stake"}
        </button>

        <button
          className="ai-link"
          style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 3a6 6 0 0 0-6 6c0 4 6 10 6 10s6-6 6-10a6 6 0 0 0-6-6z" />
            <circle cx="12" cy="9" r="2" />
          </svg>
          Unlock AI Analysis — $0.50
        </button>
      </div>
    </aside>
  );
}
