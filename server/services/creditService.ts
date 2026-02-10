/**
 * Credit Service
 * Handles credit balance management, transactions, and usage tracking
 */

import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

// Credit costs for different actions
export const CREDIT_COSTS = {
  GENERATION: 10,
  AUDIT: 5,
  COST_ANALYSIS: 5,
  CLOUD_SCAN: 20,
  RECOMMENDATION: 15,
  AGENT_ANALYSIS: 25,
  DEPLOY_PLAN: 15,
  DEPLOY_APPLY: 30,
} as const;

// Credit pack definitions
export const CREDIT_PACKS = {
  STARTER: { name: 'Starter', credits: 100, price: 900, priceId: 'pri_starter_placeholder' }, // $9
  PRO: { name: 'Pro', credits: 500, price: 3900, priceId: 'pri_pro_placeholder' },       // $39
  GROWTH: { name: 'Growth', credits: 2000, price: 12900, priceId: 'pri_growth_placeholder' }, // $129
  SCALE: { name: 'Scale', credits: 10000, price: 49900, priceId: 'pri_scale_placeholder' },  // $499
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * Get or create credit balance for a user
 */
export async function getOrCreateCreditBalance(userId: string) {
  let balance = await prisma.creditBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    // Create new balance with welcome bonus
    balance = await prisma.creditBalance.create({
      data: {
        userId,
        balance: 50, // Welcome credits
      },
    });

    // Record the welcome bonus transaction
    await prisma.creditTransaction.create({
      data: {
        creditBalanceId: balance.id,
        amount: 50,
        type: TransactionType.BONUS,
        description: 'Welcome bonus credits',
      },
    });
  }

  return balance;
}

/**
 * Get current credit balance for a user
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const balance = await getOrCreateCreditBalance(userId);
  return balance.balance;
}

/**
 * Check if user has enough credits for an action
 */
export async function hasEnoughCredits(
  userId: string,
  action: CreditAction
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  const cost = CREDIT_COSTS[action];
  return balance >= cost;
}

/**
 * Deduct credits for an action
 */
export async function deductCredits(
  userId: string,
  action: CreditAction,
  referenceId?: string
): Promise<{ success: boolean; remainingBalance: number; error?: string }> {
  const cost = CREDIT_COSTS[action];
  const balance = await getOrCreateCreditBalance(userId);

  if (balance.balance < cost) {
    return {
      success: false,
      remainingBalance: balance.balance,
      error: `Insufficient credits. You need ${cost} credits but only have ${balance.balance}.`,
    };
  }

  // Deduct credits and record transaction
  const [updatedBalance] = await prisma.$transaction([
    prisma.creditBalance.update({
      where: { id: balance.id },
      data: {
        balance: { decrement: cost },
        lifetimeUsed: { increment: cost },
      },
    }),
    prisma.creditTransaction.create({
      data: {
        creditBalanceId: balance.id,
        amount: -cost,
        type: TransactionType[action] || TransactionType.GENERATION,
        description: `${action.charAt(0) + action.slice(1).toLowerCase().replace('_', ' ')}`,
        referenceId,
      },
    }),
  ]);

  return {
    success: true,
    remainingBalance: updatedBalance.balance,
  };
}

/**
 * Add credits to user balance (for purchases)
 */
export async function addCredits(
  userId: string,
  amount: number,
  stripePaymentId?: string,
  description: string = 'Credit purchase'
): Promise<{ success: boolean; newBalance: number }> {
  const balance = await getOrCreateCreditBalance(userId);

  const [updatedBalance] = await prisma.$transaction([
    prisma.creditBalance.update({
      where: { id: balance.id },
      data: {
        balance: { increment: amount },
      },
    }),
    prisma.creditTransaction.create({
      data: {
        creditBalanceId: balance.id,
        amount,
        type: TransactionType.PURCHASE,
        description,
        stripePaymentId,
      },
    }),
  ]);

  return {
    success: true,
    newBalance: updatedBalance.balance,
  };
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
) {
  const balance = await prisma.creditBalance.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: limit,
      },
    },
  });

  return balance?.transactions || [];
}

/**
 * Get usage statistics for a user
 */
export async function getUsageStats(userId: string) {
  const balance = await prisma.creditBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    return {
      currentBalance: 0,
      lifetimeUsed: 0,
      transactions: [],
    };
  }

  // Get recent transactions grouped by type
  const recentTransactions = await prisma.creditTransaction.groupBy({
    by: ['type'],
    where: {
      creditBalanceId: balance.id,
      amount: { lt: 0 }, // Only usage transactions
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    _sum: { amount: true },
    _count: true,
  });

  return {
    currentBalance: balance.balance,
    lifetimeUsed: balance.lifetimeUsed,
    last30Days: recentTransactions.map(t => ({
      type: t.type,
      totalUsed: Math.abs(t._sum.amount || 0),
      count: t._count,
    })),
  };
}
