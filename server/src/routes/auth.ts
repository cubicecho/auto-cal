import type { DB } from '@auto-cal/db';
import { users } from '@auto-cal/db/schema';
import type { Router } from 'express';
import express from 'express';
import { signMagicToken, signSessionToken, verifyToken } from '../auth.ts';

export function createAuthRouter(db: DB): Router {
  const router = express.Router();

  // POST /api/auth/request — request a magic link
  router.post('/request', express.json(), async (req, res) => {
    const { email } = req.body ?? {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    const token = await signMagicToken(email.toLowerCase().trim());
    const magicLink = `${req.protocol}://${req.get('host')}/auth/verify?token=${token}`;

    // In production: send email. In development: log to console.
    if (process.env.NODE_ENV === 'production') {
      // TODO: integrate Resend or Nodemailer
      console.log(`[auth] Magic link for ${email}: ${magicLink}`);
    } else {
      console.log(`\n[auth] Magic link for ${email}:\n${magicLink}\n`);
    }

    res.json({ ok: true });
  });

  // GET /api/auth/verify — verify a magic link token and issue session
  router.get('/verify', async (req, res) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Token required' });
      return;
    }

    const payload = await verifyToken(token);
    if (!payload?.email) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const email = payload.email;

    // Find or create user
    let user = await db.query.users.findFirst({ where: { email } });
    if (!user) {
      const [created] = await db.insert(users).values({ email }).returning();
      if (!created) {
        res.status(500).json({ error: 'Failed to create user' });
        return;
      }
      user = created;
    }

    const sessionToken = await signSessionToken(user.id, user.email);
    res.json({ token: sessionToken, userId: user.id });
  });

  return router;
}
