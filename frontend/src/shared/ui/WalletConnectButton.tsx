'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, type Connector } from 'wagmi';
import { getUsdcAddress, USDC_ABI } from '@/shared/lib/contracts';

export function WalletConnectButton() {
  const { address, isConnected, isConnecting, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAnyModalOpen = isConnectModalOpen || isAccountModalOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  const usdcAddress = getUsdcAddress();

  // Fetch the user's USDC balance on Base Sepolia
  const { data: balanceResult } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const balanceRaw = balanceResult as bigint | undefined;

  // Find the injected connector (e.g., MetaMask) and the Porto connector
  const injectedConnector = connectors.find((c) => c.type === 'injected');
  const portoConnector = connectors.find((c) => c.id === 'xyz.ithaca.porto');

  const handleConnect = (conn: Connector) => {
    connect({ connector: conn });
    setIsConnectModalOpen(false);
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && address) {
    const truncatedAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
    const connectorLabel = connector?.id === 'xyz.ithaca.porto' ? 'Porto AA' : (connector?.name || 'Wallet');
    const formattedBalance = balanceRaw !== undefined
      ? `${(Number(balanceRaw) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
      : '0.00 USDC';

    return (
      <>
        <button className="wallet-btn connected" onClick={() => setIsAccountModalOpen(true)}>
          <span className="wallet-dot"></span> {connectorLabel} ({truncatedAddress})
        </button>

        {isAccountModalOpen && (
          <div className="modal-overlay" onClick={() => setIsAccountModalOpen(false)}>
            <div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()} 
              style={{ maxWidth: '460px', padding: '32px' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: 0, textTransform: 'uppercase', color: 'var(--fg)' }}>
                  Wallet Account
                </h2>
                <button 
                  onClick={() => setIsAccountModalOpen(false)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    padding: 0
                  }}
                >
                  [Close]
                </button>
              </div>

              {/* Account details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Provider info */}
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Connected Provider
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--fg)' }}>
                    {connectorLabel}
                  </div>
                </div>

                {/* Address and Copy */}
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Wallet Address
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', wordBreak: 'break-all', color: 'var(--fg)', marginRight: '8px' }}>
                      {address}
                    </span>
                    <button 
                      onClick={handleCopyAddress}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        background: 'none',
                        border: '1px solid var(--border)',
                        color: copied ? 'var(--accent)' : 'var(--fg)',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    USDC Balance (Base Sepolia)
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
                    {formattedBalance}
                  </div>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={() => {
                    disconnect();
                    setIsAccountModalOpen(false);
                  }}
                  style={{
                    padding: '12px',
                    border: '1.5px solid #FF5555',
                    background: 'none',
                    color: '#FF5555',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  Disconnect Wallet
                </button>

              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (isConnecting) {
    return (
      <button className="wallet-btn connecting" disabled>
        <span className="wallet-dot"></span> Connecting...
      </button>
    );
  }

  return (
    <>
      <button className="wallet-btn" onClick={() => setIsConnectModalOpen(true)}>
        <span className="wallet-dot"></span> Connect Wallet
      </button>

      {isConnectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsConnectModalOpen(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '440px', padding: '32px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', margin: 0, textTransform: 'uppercase', color: 'var(--fg)' }}>
                Connect Wallet
              </h2>
              <button 
                onClick={() => setIsConnectModalOpen(false)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  padding: 0
                }}
              >
                [Close]
              </button>
            </div>

            {/* Wallet Provider List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {injectedConnector && (
                <button
                  onClick={() => handleConnect(injectedConnector)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--fg)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: 0
                  }}
                >
                  <span>MetaMask (Standard EOA)</span>
                  <span style={{ fontSize: '14px', color: 'var(--muted)' }}>→</span>
                </button>
              )}

              {portoConnector ? (
                <button
                  onClick={() => handleConnect(portoConnector)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px 20px',
                    border: '1.5px solid var(--accent)',
                    background: 'var(--surface)',
                    color: 'var(--fg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', color: 'var(--accent)' }}>
                      MetaMask Smart Account
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--accent)' }}>→</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '4px', textTransform: 'uppercase' }}>
                    Porto AA - Gasless Prediction
                  </span>
                </button>
              ) : (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '12px' }}>
                  Smart accounts (Porto) connector not detected.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
