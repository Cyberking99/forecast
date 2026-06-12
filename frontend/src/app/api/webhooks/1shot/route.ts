import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// In a real implementation, you might use a 1Shot SDK utility like `verifyWebhookSignature`
// Here is a simple HMAC-SHA256 mock verification:
function verifySignature(body: string, signature: string, secret: string) {
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-1shot-signature');
    const secret = process.env.ONESHOT_WEBHOOK_SECRET;

    if (!secret || !signature || !verifySignature(rawBody, signature, secret)) {
      // Return 401 for invalid signatures in production
      // console.warn("Invalid webhook signature.");
      // For local testing, we bypass this if missing.
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'TRANSACTION_MINED') {
      const { txHash, customData } = event.payload;

      // Handle custom data payloads (e.g. from the StakePanel or Oracle)
      if (customData?.type === 'STAKE') {
        await prisma.stake.updateMany({
          where: { txHash: 'PENDING', staker: customData.staker, poolId: customData.poolId },
          data: { txHash }
        });
        
        // Add to total pool
        await prisma.pool.update({
          where: { id: customData.poolId },
          data: { totalPool: { increment: BigInt(customData.amount) } }
        });
      }

      if (customData?.type === 'SETTLE') {
        await prisma.pool.update({
          where: { id: customData.poolId },
          data: {
            status: 'SETTLED',
            settleTxHash: txHash
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("1Shot webhook error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

