'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnectButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Find the injected connector (e.g., MetaMask)
  const injectedConnector = connectors.find((c) => c.type === 'injected');

  if (isConnected && address) {
    // Truncate address to 0xA1...b2
    const truncatedAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
    return (
      <button className="wallet-btn connected" onClick={() => disconnect()}>
        <span className="wallet-dot"></span> {truncatedAddress}
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
    <button 
      className="wallet-btn" 
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
    >
      <span className="wallet-dot"></span> Connect Wallet
    </button>
  );
}
