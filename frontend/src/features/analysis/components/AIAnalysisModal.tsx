"use client";

import React, { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { USDC_ABI, getUsdcAddress } from "@/shared/lib/contracts";

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  question?: string;
  options?: string[];
}

export function AIAnalysisModal({ isOpen, onClose, question = "Will this prediction resolve?", options = ["Yes", "No"] }: AIAnalysisModalProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    confidence: number;
    riskLevel: string;
    analysisText: string[];
    sources: string[];
    probabilities: number[];
  } | null>(null);

  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const handleUnlock = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Initiating USDC transfer for AI Analysis...");
      
      // Send 0.50 USDC (500,000 micro-USDC) to FeeCollector on-chain
      const txHash = await writeContractAsync({
        address: getUsdcAddress() as `0x${string}`,
        abi: USDC_ABI,
        functionName: "transfer",
        args: ["0x47D190ed0bBcD757765a0A3862535D68BF000cF5", BigInt(500000)],
      });
      
      console.log(`Payment transaction submitted: ${txHash}. Fetching AI report...`);

      const q = encodeURIComponent(question);
      const opts = encodeURIComponent(options.join(","));
      const res = await fetch(`/api/analysis?question=${q}&options=${opts}&tx=${txHash}`, {
        headers: {
          "Authorization": "L402 invoice=\"lnbc12000...\", macaroon=\"MDAxY2xvY2F0...\"",
        },
      });
      if (res.ok) {
        const json = await res.json();
        setAnalysis(json.data);
        setIsUnlocked(true);
      } else {
        console.error("Payment validation failed:", res.status);
      }
    } catch (err) {
      console.error("Error unlocking AI analysis:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Render probability gauges dynamically based on option length
  const displayProbabilities = analysis?.probabilities || options.map((_, i) => (i === 0 ? 62 : i === 1 ? 38 : Math.floor(100 / options.length)));

  return (
    <div className="modal-overlay open" id="ai-modal">
      <div className="modal-content" style={{ position: "relative" }}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div data-ai-locked={!isUnlocked ? "true" : undefined}>
          <div className={!isUnlocked ? "blur-preview" : ""} data-ai-unlock={!isUnlocked ? "true" : undefined}>
            <div className="modal-title" style={{ marginTop: "8px" }}>
              AI Analysis Report
            </div>

            {/* Dynamic Gauges */}
            <div style={{ marginBottom: "16px" }}>
              {options.map((opt, idx) => {
                const probability = displayProbabilities[idx] || 0;
                return (
                  <div className="gauge-bar" key={idx} style={{ marginBottom: "8px" }}>
                    <span className="gauge-label">{opt}</span>
                    <div className="gauge-track">
                      <div className="gauge-fill" style={{ width: `${probability}%` }}></div>
                    </div>
                    <span className="gauge-value">{probability}%</span>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--muted)", marginBottom: "16px" }}>
              {analysis ? (
                analysis.analysisText.map((p, i) => (
                  <p key={i} style={{ marginBottom: "12px" }}>{p}</p>
                ))
              ) : (
                <>
                  <p style={{ marginBottom: "12px" }}>
                    Evaluating historical trends and key performance benchmarks relevant to this market. Our models assess standard variance bounds and macroeconomic triggers.
                  </p>
                  <p style={{ marginBottom: "12px" }}>
                    Current sentiment index and underlying trade volumes reflect standard liquidity distribution, indicating balanced odds.
                  </p>
                  <p>
                    Key resolution parameters are monitored in real time. Full analysis report details will unlock upon invoice settlement.
                  </p>
                </>
              )}
            </div>

            {/* Confidence Gauge */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}>Confidence</span>
              <div className="confidence-arc" style={{ width: "48px", height: "24px" }}>
                <div
                  className="confidence-arc-fill"
                  style={{
                    background: `conic-gradient(var(--accent) 0deg ${((analysis?.confidence || 68) / 100) * 360}deg, var(--border) ${((analysis?.confidence || 68) / 100) * 360}deg 360deg)`,
                    borderRadius: "24px 24px 0 0",
                  }}
                ></div>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {analysis?.confidence || 68}%
              </span>
            </div>

            {/* Risk Indicator */}
            <div className="risk-indicator">
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Risk Score</span>
              <div className="risk-bar">
                <div className="risk-fill medium" style={{ width: analysis?.riskLevel === 'High' ? "85%" : analysis?.riskLevel === 'Medium' ? "42%" : "20%" }}></div>
              </div>
              <span className="risk-label">{analysis?.riskLevel || 'Medium'}</span>
            </div>

            {/* Sources */}
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px" }}>
              {analysis ? (
                analysis.sources.map((src, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span>📄</span>
                    <span>{src}</span>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span>📄</span>
                    <span>Market Volume & Sentiment Indicators</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>📄</span>
                    <span>Historical Industry Trend Analysis</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "12px", borderTop: "1px solid var(--border)", fontSize: "11px", color: "var(--muted)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a6 6 0 0 0-6 6c0 4 6 10 6 10s6-6 6-10a6 6 0 0 0-6-6z" />
                <circle cx="12" cy="9" r="2" />
              </svg>
              Powered by Venice AI · Private inference
            </div>
          </div>

          {!isUnlocked && (
            <div className="blur-overlay" style={{ position: "absolute" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>AI Analysis Report</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px" }}>
                  Venice AI evaluates options, confidence, and risk
                </div>
                <button 
                  className="btn btn-primary btn-pay-ai"
                  onClick={handleUnlock}
                  disabled={isLoading}
                >
                  {isLoading ? "Unlocking..." : "Unlock for $0.50 USDC"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
