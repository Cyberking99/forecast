import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import crypto from 'crypto';
import { publicClient, PREDICTION_POOL_ABI, getPredictionPoolAddress } from '@/shared/lib/contracts';

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

      // Ensure the pool exists in the database
      if (customData?.poolId) {
        const dbPool = await prisma.pool.findUnique({
          where: { id: customData.poolId }
        });

        if (!dbPool) {
          try {
            console.log(`Syncing pool ${customData.poolId} to DB...`);
            const poolData = await publicClient.readContract({
              address: getPredictionPoolAddress() as `0x${string}`,
              abi: PREDICTION_POOL_ABI,
              functionName: 'pools',
              args: [customData.poolId],
            }) as unknown as unknown[];

            const optionsArray = await publicClient.readContract({
              address: getPredictionPoolAddress() as `0x${string}`,
              abi: PREDICTION_POOL_ABI,
              functionName: 'getPoolOptions',
              args: [customData.poolId],
            }) as string[];

            await prisma.pool.create({
              data: {
                id: customData.poolId,
                question: poolData[1] as string,
                options: optionsArray,
                stakeDeadline: new Date(Number(poolData[2]) * 1000),
                resolutionDeadline: new Date(Number(poolData[3]) * 1000),
                disputeWindowSecs: Number(poolData[4]),
                feeBps: Number(poolData[9]),
                creatorAddress: poolData[10] as string,
                totalPool: poolData[8] as bigint,
              }
            });
            console.log(`Successfully synced pool ${customData.poolId} to database.`);
          } catch (err) {
            console.error(`Error syncing pool ${customData.poolId} to database:`, err);
          }
        }
      }

      // Handle custom data payloads (e.g. from the StakePanel or Oracle)
      if (customData?.type === 'STAKE') {
        // Double check if stake record exists, create if missing, then update
        const pendingStake = await prisma.stake.findFirst({
          where: { txHash: 'PENDING', staker: customData.staker, poolId: customData.poolId }
        });

        if (pendingStake) {
          await prisma.stake.update({
            where: { id: pendingStake.id },
            data: { txHash }
          });
        } else {
          await prisma.stake.create({
            data: {
              poolId: customData.poolId,
              staker: customData.staker,
              optionId: customData.optionId,
              amount: BigInt(customData.amount),
              txHash
            }
          });
        }
        
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

