"use client";

import React, { useState, useEffect } from "react";
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
  question = "Will this prediction resolve?",
  optionsLabels = []
}: StakePanelProps) {
  const [amount, setAmount] = useState<string>("");
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

  // Separate loading states for permission grant vs staking to avoid UI overlap
  const [isPermissionPending, setIsPermissionPending] = useState(false);
  const [isStakePending, setIsStakePending] = useState(false);
  
  const [txError, setTxError] = useState<string | null>(null);
  const [showPopupWarning, setShowPopupWarning] = useState(false);
  const [hasSessionKey, setHasSessionKey] = useState(false);

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

  // Check query permissions
  const activePermission = permissions?.find((p) => {
    return p.expiry > Date.now() / 1000;
  });

  // Initialize and synchronize session key state with localStorage to persist through page refreshes
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`porto_session_active_${address}`);
      if (stored === "true") {
        setHasSessionKey(true);
      }
    } else {
      setHasSessionKey(false);
    }
  }, [address]);

  useEffect(() => {
    if (activePermission) {
      setHasSessionKey(true);
      if (address) {
        localStorage.setItem(`porto_session_active_${address}`, "true");
      }
    }
  }, [activePermission, address]);

  // Show warning popup guide if transaction is pending for too long
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const isAnyPending = isPermissionPending || isStakePending;
    if (isAnyPending) {
      timer = setTimeout(() => {
        setShowPopupWarning(true);
      }, 8000);
    } else {
      setShowPopupWarning(false);
    }
    return () => clearTimeout(timer);
  }, [isPermissionPending, isStakePending]);

  const handleGrantPermissions = async () => {
    try {
      setTxError(null);
      setIsPermissionPending(true);
      setShowPopupWarning(false);
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
      setHasSessionKey(true);
      if (address) {
        localStorage.setItem(`porto_session_active_${address}`, "true");
      }
      await refetchPermissions();
    } catch (err: unknown) {
      console.error("Failed to grant permissions:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setTxError(errorMessage || "Failed to grant permissions");
    } finally {
      setIsPermissionPending(false);
    }
  };

  // Math formula elements
  let mathFormula = "0 × (0 / 0) = 0.00 USDC";
  let payoutResult = "0.00";
  let impliedOdds = "1.00x";

  if (selectedOptionIdx !== null && options[selectedOptionIdx]) {
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

    setIsStakePending(true);
    setTxError(null);
    setShowPopupWarning(false);

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
      setIsStakePending(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayLabels = optionsLabels.length > 0 ? optionsLabels : options.map((o) => o.label);

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
                </div>
                {!hasSessionKey ? (
                  <>
                    <p style={{ color: "var(--muted)", marginBottom: "12px" }}>
                      Authorize gasless predictions for 7 days.
                    </p>
                    <button
                      className="btn btn-secondary btn-block btn-small"
                      onClick={handleGrantPermissions}
                      disabled={isPermissionPending}
                    >
                      {isPermissionPending ? "AUTHORIZING..." : "ENABLE ONE-CLICK STAKING"}
                    </button>
                  </>
                ) : (
                  <p style={{ color: "var(--muted)" }}>Session scopes approved for gasless execution.</p>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOptionIdx(idx)}
                  className={`btn btn-block ${selectedOptionIdx === idx ? "btn-primary" : "btn-secondary"}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textTransform: "uppercase" }}
                >
                  <span>{opt.label}</span>
                  <span style={{ fontSize: "11px", color: selectedOptionIdx === idx ? "inherit" : "var(--muted)" }}>
                    ODDS: {opt.odds}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ position: "relative", marginBottom: "24px" }}>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px 64px 16px 16px",
                  fontSize: "20px",
                  fontFamily: "var(--font-mono)",
                  border: "2px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--fg)",
                  borderRadius: 0,
                  outline: "none"
                }}
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
              disabled={!isConnected || selectedOptionIdx === null || !amount || isStakePending}
              onClick={handleStake}
            >
              {isStakePending
                ? "CONFIRMING..."
                : !isConnected
                ? "CONNECT WALLET"
                : selectedOptionIdx === null
                ? "SELECT OPTION"
                : isPorto && hasSessionKey
                ? "⚡ INSTANT STAKE"
                : "STAKE"}
            </button>

            {showPopupWarning && (
              <div style={{ marginTop: "12px", padding: "12px", border: "1.5px solid var(--accent)", background: "var(--surface)", fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                💡 Transaction taking longer than expected? Check if a MetaMask or Porto confirmation popup is minimized or blocked by your browser.
              </div>
            )}
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
        options={displayLabels}
      />
    </>
  );
}
