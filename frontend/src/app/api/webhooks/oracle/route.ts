import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.ORACLE_WEBHOOK_SECRET;

    // Simple Bearer token authentication for the Oracle -> Backend call
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { poolId, verdictJson, verdictHash, winningOptionId } = await req.json();

    if (!poolId || !verdictJson) {
      return NextResponse.json({ error: 'Missing poolId or verdictJson' }, { status: 400 });
    }

    const parsedVerdict = JSON.parse(verdictJson);
    const newStatus = parsedVerdict.status === 'UNRESOLVABLE' ? 'UNRESOLVABLE' : 'RESOLVED';

    // Update the pool with the AI's transparent reasoning and status
    await prisma.pool.update({
      where: { id: poolId },
      data: {
        status: newStatus,
        winningOptionId: winningOptionId ?? null,
        verdictHash: verdictHash,
        verdictJson: verdictJson,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Oracle webhook error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

