import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionKey, userOp } = body;

    if (!sessionKey || !userOp) {
      return NextResponse.json({ error: 'Missing sessionKey or userOp' }, { status: 400 });
    }

    // In a real implementation, this would:
    // 1. Verify the session key is valid and within permissions (ERC-7715)
    // 2. Wrap the userOp in a transaction using the relayer's EOA/bundler
    // 3. Submit to the network (e.g. Base Sepolia)
    // 4. Return the transaction hash

    console.log('Received 1Shot Relay Request:', { sessionKey, userOp });

    // Mock successful relay
    const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    return NextResponse.json({ success: true, txHash: mockTxHash });
  } catch (error) {
    console.error('Relay error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
