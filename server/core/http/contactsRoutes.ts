import type { Express } from 'express';
import { z } from 'zod';
import { deleteContact, listContacts, upsertContact } from '../sms/contacts';

function maskPhone(phone: string): string {
  return phone.slice(0, 3) + '•'.repeat(Math.max(0, phone.length - 5)) + phone.slice(-2);
}

const upsertSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^\+1\d{10}$/, 'Phone must be E.164 format: +1XXXXXXXXXX'),
  name: z.string().optional().transform((v) => {
    const trimmed = v?.trim();
    return trimmed || undefined;
  }),
});

export function registerContactsRoutes(app: Express): void {
  app.get('/api/contacts', async (_req, res) => {
    try {
      const contacts = await listContacts();
      const masked = contacts.map((c) => ({
        ...c,
        phone: maskPhone(c.phone),
      }));
      res.json(masked);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/contacts', async (req, res) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Invalid input' });
      return;
    }
    try {
      await upsertContact(parsed.data);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete('/api/contacts/:email', async (req, res) => {
    try {
      await deleteContact(req.params.email);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}
