'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnectButton() {
  const { address, isConnected, isConnecting, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Find the injected connector (e.g., MetaMask) and the Porto connector
  const injectedConnector = connectors.find((c) => c.type === 'injected');
  const portoConnector = connectors.find((c) => c.id === 'xyz.ithaca.porto');

  if (isConnected && address) {
    // Truncate address to 0xA1...b2
    const truncatedAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
    const connectorLabel = connector?.id === 'xyz.ithaca.porto' ? 'Porto' : (connector?.name || 'Wallet');
    
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
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button 
        className="wallet-btn" 
        onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      >
        <span className="wallet-dot"></span> MetaMask
      </button>
      
      {portoConnector && (
        <button 
          className="wallet-btn" 
          onClick={() => connect({ connector: portoConnector })}
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderColor: '#4f46e5',
            color: 'white',
          }}
        >
          <span className="wallet-dot" style={{ backgroundColor: '#22c55e' }}></span> Porto AA
        </button>
      )}
    </div>
  );
}

