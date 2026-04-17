import { eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { phoneContacts } from '../db/schema';

function generateId(): string {
  return `pc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function getPhoneForEmail(email: string): Promise<string | null> {
  const rows = await db
    .select({ phone: phoneContacts.phone })
    .from(phoneContacts)
    .where(eq(phoneContacts.email, email.toLowerCase()))
    .limit(1);
  return rows[0]?.phone ?? null;
}

export async function getPhonesForEmails(emails: string[]): Promise<string[]> {
  if (emails.length === 0) return [];
  const normalized = [...new Set(emails.map((e) => e.toLowerCase()))];
  const rows = await db
    .select({ phone: phoneContacts.phone })
    .from(phoneContacts)
    .where(inArray(phoneContacts.email, normalized));
  return rows.map((r) => r.phone);
}

export async function upsertContact(contact: {
  email: string;
  phone: string;
  name?: string;
}): Promise<void> {
  const now = new Date();
  const email = contact.email.toLowerCase();

  await db
    .insert(phoneContacts)
    .values({
      id: generateId(),
      email,
      phone: contact.phone,
      name: contact.name ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: phoneContacts.email,
      set: {
        phone: contact.phone,
        name: contact.name ?? null,
        updatedAt: now,
      },
    });
}

export async function deleteContact(email: string): Promise<void> {
  await db
    .delete(phoneContacts)
    .where(eq(phoneContacts.email, email.toLowerCase()));
}

export async function listContacts(): Promise<
  { id: string; email: string; phone: string; name: string | null; updatedAt: Date }[]
> {
  return db
    .select({
      id: phoneContacts.id,
      email: phoneContacts.email,
      phone: phoneContacts.phone,
      name: phoneContacts.name,
      updatedAt: phoneContacts.updatedAt,
    })
    .from(phoneContacts)
    .orderBy(phoneContacts.email);
}
