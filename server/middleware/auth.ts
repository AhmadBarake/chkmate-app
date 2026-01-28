import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../lib/errors.js';

const prisma = new PrismaClient();

// Extend Request type to include auth and userId
declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string | null;
        sessionId: string | null;
        getToken: () => Promise<string | null>;
      };
      userId?: string; // Internal UUID
    }
  }
}

export const clerkMiddleware = ClerkExpressWithAuth();

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const clerkId = req.auth.userId;

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
        // Fetch user from Clerk for email? Or just create with minimal info
        // For now, we might need to rely on what we have or fetch from Clerk API if needed
        // Assuming we sync on webhook or just lazily create here.
        // Note: Clerk SDK can give us user details if we use `users.getUser(clerkId)` but that requires Secret Key
        
        // For simple lazy creation without extra API call if we don't have email:
        // Ideally we should use webhooks for user sync.
        // For now, let's try to find by email if we can get it from token claims or just create basic.
        // But we don't have email here easily without extra call.
        
        // Let's assume for now we just create with clerkId and update details later/via webhook
        // Or if the initial flow sends user data. Note: The frontend calls createProject which sends email/name.
        // But for generic auth, we might just need the ID.
        
        // If we really need email, we should use the Clerk Client to fetch it.
        // import { users } from '@clerk/clerk-sdk-node';
        // const clerkUser = await users.getUser(clerkId);
        
        // Simplified for this step:
        console.log(`User ${clerkId} not found in DB, lazy creating...`);
        try {
            user = await prisma.user.create({
                data: {
                    clerkId,
                    email: `pending_${clerkId}@placeholder.com`, // Placeholder, will be updated or assume webhook handles it
                    name: 'New User',
                }
            });
        } catch (e) {
             // Handle race condition
             user = await prisma.user.findUnique({ where: { clerkId } });
        }
    }

    if (!user) {
        throw new AppError('User synchronization failed', 401);
    }
    
    // Ensure infinite credits for now (Beta)
    try {
        await prisma.creditBalance.upsert({
          where: { userId: user.id },
          update: { 
            balance: 1000000, 
          },
          create: {
            userId: user.id,
            balance: 1000000,
          },
        });
      } catch (e) {
        console.error('Failed to ensure credits:', e);
      }

    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
