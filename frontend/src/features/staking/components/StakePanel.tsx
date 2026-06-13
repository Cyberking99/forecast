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

  const { data: permissions, refetch: refetchPermissions } = Hooks.usePermissions({
    query: { enabled: isConnected && isPorto }
  });

  const { mutateAsync: grantPermissions } = Hooks.useGrantPermissions();

  const [isTxPending, setIsTxPending] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const poolAddress = getPredictionPoolAddress() as `0x${string}`;
  const usdcAddress = getUsdcAddress() as `0x${string}`;

  const targetChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
  const isWrongNetwork = isConnected && chainId !== targetChainId;

  const { data: balanceResult, refetch: refetchBalance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isWrongNetwork },
  });

  const balanceRaw = balanceResult as bigint | undefined;
  const balanceFormatted = balanceRaw ? Number(balanceRaw) / 10 ** 6 : 0;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, poolAddress] : undefined,
    query: { enabled: !!address && !isWrongNetwork },
  });

  const activePermission = permissions?.find((p) => {
    const isNotExpired = p.expiry > Date.now() / 1000;
    if (!isNotExpired) return false;
    return p.permissions.calls?.some((c) => c.to?.toLowerCase() === poolAddress.toLowerCase());
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
            { to: poolAddress, signature: "stake(bytes32,uint8,uint256)" },
            { to: usdcAddress, signature: "approve(address,uint256)" }
          ],
          spend: [
            { limit: BigInt(1000 * 10 ** 6), period: "day", token: usdcAddress }
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

  // Math formula elements
  let mathFormula = "0 × (0 / 0) = 0.00 USDC";
  let payoutResult = "0.00";
  let impliedOdds = "1.00x";

  if (selectedOptionIdx !== null) {
    const selectedOpt = options[selectedOptionIdx];
    const ti = Number(selectedOpt.totalStakedRaw) / 10 ** 6;
    const s = amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) : 0;

    const currentTotalPool = totalPool;
    const odds = (currentTotalPool + s) / (ti + s);
    impliedOdds = `${odds.toFixed(2)}x`;
    const payout = s * odds;
    payoutResult = payout.toFixed(2);

    mathFormula = `${s.toLocaleString(undefined, { maximumFractionDigits: 2 })} × (${(currentTotalPool + s).toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${(ti + s).toLocaleString(undefined, { maximumFractionDigits: 0 })}) = ${payoutResult} USDC`;
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
        await sendCallsAsync({
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
      } else {
        const currentAllowance = (allowance as bigint) ?? BigInt(0);
        if (currentAllowance < amountBigInt) {
          await writeContractAsync({
            address: usdcAddress,
            abi: USDC_ABI,
            functionName: "approve",
            args: [poolAddress, amountBigInt * BigInt(10)],
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await refetchAllowance();
        }

        await writeContractAsync({
          address: poolAddress,
          abi: PREDICTION_POOL_ABI,
          functionName: "stake",
          args: [poolId as `0x${string}`, selectedOptionIdx, amountBigInt],
        });
      }

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
      <div className="stake-panel-col" style={{ borderLeft: "1px solid var(--border)", paddingLeft: "40px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "20px" }}>PLACE YOUR STAKE</h3>

        {isWrongNetwork ? (
          <div style={{ padding: "16px", border: "2px solid var(--border)", background: "var(--surface)", marginBottom: "20px" }}>
            <p style={{ fontSize: "12px", marginBottom: "16px" }}>Please connect to the correct network.</p>
            <button className="btn btn-primary btn-block" onClick={() => switchChain({ chainId: targetChainId })}>
              Switch Network
            </button>
          </div>
        ) : (
          <>
            {isConnected && balanceRaw !== undefined && (
              <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", marginBottom: "16px" }}>
                BALANCE: <span style={{ color: "var(--fg)" }}>{balanceFormatted.toFixed(2)} USDC</span>
              </div>
            )}

            {isPorto && (
              <div style={{
                margin: "0 0 24px 0",
                padding: "16px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: "12px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 700, color: hasSessionKey ? "var(--accent)" : "var(--fg)" }}>
                    {hasSessionKey ? "⚡ ONE-CLICK STAKING ACTIVE" : "ONE-CLICK STAKING"}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--muted)" }}>PORTO AA</span>
                </div>
                {!hasSessionKey ? (
                  <>
                    <p style={{ color: "var(--muted)", marginBottom: "12px" }}>
                      Enable silent execution for gasless staking without wallet prompts.
                    </p>
                    <button 
                      className="btn btn-primary btn-block"
                      style={{ fontSize: "11px", padding: "8px" }}
                      disabled={isTxPending}
                      onClick={handleGrantPermissions}
                    >
                      {isTxPending ? "ENABLING..." : "ENABLE ONE-CLICK STAKING"}
                    </button>
                  </>
                ) : (
                  <p style={{ color: "var(--muted)" }}>Session scopes approved for gasless execution.</p>
                )}
              </div>
            )}

            <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
              Selected Option: <span style={{ color: "var(--fg)", fontWeight: 700 }}>
                {selectedOptionIdx !== null && options[selectedOptionIdx] ? options[selectedOptionIdx].label : "None"}
              </span>
            </div>

            {/* Underline input box */}
            <div className="underlined-input-wrap" style={{ position: "relative", marginBottom: "20px" }}>
              <input
                className="underlined-input"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                disabled={isTxPending || !isConnected}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span style={{ position: "absolute", right: 0, bottom: "12px", fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--muted)" }}>
                USDC
              </span>
            </div>

            {/* Inline Mathematical Formula */}
            <div className="math-formula">
              <div style={{ textTransform: "uppercase", fontSize: "10px", color: "var(--muted)", marginBottom: "4px" }}>
                Projected Return Formula
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", wordBreak: "break-all" }}>
                {mathFormula}
              </div>
              <div style={{ marginTop: "8px", fontSize: "10px", color: "var(--muted)" }}>
                Implied Odds: <strong style={{ color: "var(--fg)" }}>{impliedOdds}</strong>
              </div>
            </div>

            {txError && (
              <div style={{ color: "var(--red)", fontSize: "12px", marginTop: "12px", border: "1.5px solid var(--red)", padding: "10px", background: "var(--surface)" }}>
                ⚠️ {txError}
              </div>
            )}

            <button
              className="btn btn-primary btn-block btn-accent"
              style={{ marginTop: "24px" }}
              disabled={!isConnected || selectedOptionIdx === null || !amount || isTxPending}
              onClick={handleStake}
            >
              {isTxPending
                ? "CONFIRMING..."
                : !isConnected
                ? "CONNECT WALLET"
                : selectedOptionIdx === null
                ? "SELECT OPTION"
                : isPorto && hasSessionKey
                ? "⚡ INSTANT STAKE"
                : "STAKE"}
            </button>
          </>
        )}

        <button
          className="btn btn-secondary btn-block"
          style={{ marginTop: "16px" }}
          onClick={() => setIsModalOpen(true)}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ marginRight: "8px" }}
          >
            <path d="M12 3v18M3 12h18" />
          </svg>
          UNLOCK AI ANALYSIS — $0.50
        </button>
      </div>

      <AIAnalysisModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        question={question}
        options={optionsLabels}
      />
    </>
  );
}
