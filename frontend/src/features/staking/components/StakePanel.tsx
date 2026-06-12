"use client";

import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useChainId, useSwitchChain, useSendCalls } from "wagmi";
import { Hooks } from "porto/wagmi";
import { getPredictionPoolAddress, getUsdcAddress, PREDICTION_POOL_ABI, USDC_ABI } from "@/shared/lib/contracts";
import { AIAnalysisModal } from "@/features/analysis/components/AIAnalysisModal";

interface Option {
  label: string;
  percentage: number;
  totalStakedStr: string;
  stakers: number;
  odds: string;
  totalStakedRaw: bigint;
}

interface StakePanelProps {
  poolId: string;
  options: Option[];
  selectedOptionIdx: number | null;
  setSelectedOptionIdx: (idx: number | null) => void;
  totalPool: number;
  refetch: () => void;
  question?: string;
  optionsLabels?: string[];
}

export function StakePanel({
  poolId,
  options,
  selectedOptionIdx,
  setSelectedOptionIdx,
  totalPool,
  refetch,
  question,
  optionsLabels,
}: StakePanelProps) {
  const [amount, setAmount] = useState("");
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendCallsAsync } = useSendCalls();

  const isPorto = connector?.id === "xyz.ithaca.porto";

  // Get permissions from Porto
  const { data: permissions, refetch: refetchPermissions } = Hooks.usePermissions({
    query: { enabled: isConnected && isPorto }
  });

  const { mutateAsync: grantPermissions } = Hooks.useGrantPermissions();

  const [isTxPending, setIsTxPending] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const poolAddress = getPredictionPoolAddress() as `0x${string}`;
  const usdcAddress = getUsdcAddress() as `0x${string}`;

  // Target chain is either local Anvil (31337) or Base Sepolia (84532)
  const targetChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
  const isWrongNetwork = isConnected && chainId !== targetChainId;

  // Fetch user's USDC balance
  const { data: balanceResult, refetch: refetchBalance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isWrongNetwork },
  });

  const balanceRaw = balanceResult as bigint | undefined;
  const balanceFormatted = balanceRaw ? Number(balanceRaw) / 10 ** 6 : 0;

  // Fetch user's USDC allowance for the Prediction Pool
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, poolAddress] : undefined,
    query: { enabled: !!address && !isWrongNetwork },
  });

  // Check if we have an active permission for prediction pool staking
  const activePermission = permissions?.find((p) => {
    const isNotExpired = p.expiry > Date.now() / 1000;
    if (!isNotExpired) return false;
    const hasCall = p.permissions.calls?.some((c) => 
      c.to?.toLowerCase() === poolAddress.toLowerCase()
    );
    return hasCall;
  });

  const hasSessionKey = !!activePermission;

  const handleGrantPermissions = async () => {
    try {
      setTxError(null);
      setIsTxPending(true);
      await grantPermissions({
        expiry: Math.floor(Date.now() / 1000) + 3600 * 24 * 7, // 7 days
        feeToken: null,
        permissions: {
          calls: [
            {
              to: poolAddress,
              signature: "stake(bytes32,uint8,uint256)"
            },
            {
              to: usdcAddress,
              signature: "approve(address,uint256)"
            }
          ],
          spend: [
            {
              limit: BigInt(1000 * 10 ** 6), // 1000 USDC
              period: "day",
              token: usdcAddress
            }
          ]
        }
      });
      await refetchPermissions();
    } catch (err: unknown) {
      console.error("Failed to grant permissions:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setTxError(errorMessage || "Failed to grant permissions");
    } finally {
      setIsTxPending(false);
    }
  };

  // Calculate live implied odds and projected share
  let impliedOdds = "—";
  let projectedShare = "$0.00";

  if (selectedOptionIdx !== null && amount && !isNaN(parseFloat(amount))) {
    const s = parseFloat(amount);
    if (s > 0) {
      const selectedOpt = options[selectedOptionIdx];
      const ti = Number(selectedOpt.totalStakedRaw) / 10 ** 6;
      const t = totalPool;
      const odds = (t + s) / (ti + s);
      impliedOdds = `${odds.toFixed(2)}x`;
      projectedShare = `$${(s * odds).toFixed(2)}`;
    }
  }

  const handleStake = async () => {
    if (!isConnected || isWrongNetwork || selectedOptionIdx === null || !amount) return;

    setIsTxPending(true);
    setTxError(null);

    try {
      const parsedAmount = Math.floor(parseFloat(amount) * 10 ** 6);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Invalid stake amount");
      }

      const amountBigInt = BigInt(parsedAmount);

      if (isPorto) {
        console.log("Executing batch stake transaction via Porto...");
        const txId = await sendCallsAsync({
          calls: [
            {
              to: usdcAddress,
              abi: USDC_ABI,
              functionName: "approve",
              args: [poolAddress, amountBigInt * BigInt(10)],
            },
            {
              to: poolAddress,
              abi: PREDICTION_POOL_ABI,
              functionName: "stake",
              args: [poolId as `0x${string}`, selectedOptionIdx, amountBigInt],
            }
          ]
        });
        console.log("Porto transaction submitted:", txId);
      } else {
        // Standard EOA flow (MetaMask): check allowance and approve if necessary
        const currentAllowance = (allowance as bigint) ?? BigInt(0);
        if (currentAllowance < amountBigInt) {
          const approveTx = await writeContractAsync({
            address: usdcAddress,
            abi: USDC_ABI,
            functionName: "approve",
            args: [poolAddress, amountBigInt * BigInt(10)], // Approve 10x
          });
          console.log("Approval transaction submitted:", approveTx);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await refetchAllowance();
        }

        // Execute stake transaction
        const stakeTx = await writeContractAsync({
          address: poolAddress,
          abi: PREDICTION_POOL_ABI,
          functionName: "stake",
          args: [poolId as `0x${string}`, selectedOptionIdx, amountBigInt],
        });
        console.log("Stake transaction submitted:", stakeTx);
      }

      // Reset and refetch
      setAmount("");
      setSelectedOptionIdx(null);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      refetch();
      refetchBalance();
      refetchAllowance();
      if (isPorto) {
        await refetchPermissions();
      }
    } catch (err: unknown) {
      console.error("Staking transaction failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const shortMessage = err && typeof err === "object" && "shortMessage" in err ? String((err as { shortMessage?: unknown }).shortMessage) : undefined;
      setTxError(shortMessage || errorMessage || "Transaction failed");
    } finally {
      setIsTxPending(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <aside className="pool-detail-sidebar">
        <div className="stake-panel">
          <div className="stake-panel-header">Place Your Stake</div>

          {isWrongNetwork ? (
            <div className="network-warning" style={{ margin: "12px 0", padding: "12px", background: "var(--amber-soft)", borderRadius: "8px", border: "1px solid var(--amber)", color: "var(--amber)", fontSize: "13px" }}>
              <p style={{ marginBottom: "8px" }}>Please connect to the correct network.</p>
              <button className="btn btn-warning btn-full" onClick={() => switchChain({ chainId: targetChainId })}>
                Switch Network
              </button>
            </div>
          ) : (
            <>
              {isConnected && balanceRaw !== undefined && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
                  <span>Balance:</span>
                  <span className="t-num">{balanceFormatted.toFixed(2)} USDC</span>
                </div>
              )}

              {isPorto && (
                <div style={{
                  margin: "0 0 16px 0",
                  padding: "12px",
                  background: hasSessionKey ? "rgba(16, 185, 129, 0.1)" : "rgba(79, 70, 229, 0.1)",
                  borderRadius: "8px",
                  border: hasSessionKey ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(79, 70, 229, 0.3)",
                  fontSize: "13px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: hasSessionKey ? "0" : "8px" }}>
                    <span style={{ fontWeight: "600", color: hasSessionKey ? "var(--green)" : "#818cf8" }}>
                      {hasSessionKey ? "⚡ One-Click Staking Active" : "One-Click Staking Available"}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>Porto AA</span>
                  </div>
                  {!hasSessionKey && (
                    <>
                      <p style={{ color: "var(--muted)", marginBottom: "8px", fontSize: "12px", lineHeight: "1.4" }}>
                        Enable silent execution for gasless staking without wallet prompts.
                      </p>
                      <button 
                        className="btn btn-secondary btn-full btn-sm"
                        disabled={isTxPending}
                        onClick={handleGrantPermissions}
                        style={{
                          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          borderColor: "#4f46e5",
                          color: "white",
                          fontWeight: "600"
                        }}
                      >
                        {isTxPending ? "Enabling..." : "Enable One-Click Staking"}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="stake-option-label" style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                Selected option: <strong>{selectedOptionIdx !== null && options[selectedOptionIdx] ? options[selectedOptionIdx].label.split(" — ")[0] : "None"}</strong>
              </div>

              <div className="stake-input-wrap">
                <input
                  className="stake-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  disabled={isTxPending || !isConnected}
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

              {txError && (
                <div className="tx-error" style={{ color: "var(--red)", fontSize: "12px", marginTop: "8px", background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "6px" }}>
                  {txError}
                </div>
              )}

              <button
                className="btn btn-primary btn-full stake-btn"
                disabled={!isConnected || selectedOptionIdx === null || !amount || isTxPending}
                onClick={handleStake}
              >
                {isTxPending
                  ? "Confirming..."
                  : !isConnected
                  ? "Connect Wallet"
                  : selectedOptionIdx === null
                  ? "Select Option"
                  : isPorto && hasSessionKey
                  ? "⚡ Instant Stake"
                  : "Stake"}
              </button>
            </>
          )}

          <button
            className="ai-link"
            style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}
            onClick={() => setIsModalOpen(true)}
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

      <AIAnalysisModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        question={question}
        options={optionsLabels}
      />
    </>
  );
}
