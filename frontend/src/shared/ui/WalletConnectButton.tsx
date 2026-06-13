'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, type Connector } from 'wagmi';

export function WalletConnectButton() {
  const { address, isConnected, isConnecting, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find the injected connector (e.g., MetaMask) and the Porto connector
  const injectedConnector = connectors.find((c) => c.type === 'injected');
  const portoConnector = connectors.find((c) => c.id === 'xyz.ithaca.porto');

  const handleConnect = (conn: Connector) => {
    connect({ connector: conn });
    setIsModalOpen(false);
  };

  if (isConnected && address) {
    // Truncate address to 0xA1...b2
    const truncatedAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
    const connectorLabel = connector?.id === 'xyz.ithaca.porto' ? 'Porto AA' : (connector?.name || 'Wallet');
    
    return (
      <button className="wallet-btn connected" onClick={() => disconnect()}>
        <span className="wallet-dot"></span> {connectorLabel} ({truncatedAddress})
      </button>
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
      <button className="wallet-btn" onClick={() => setIsModalOpen(true)}>
        <span className="wallet-dot"></span> Connect Wallet
      </button>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
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
                onClick={() => setIsModalOpen(false)}
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


