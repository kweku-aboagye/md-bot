import { randomUUID } from 'crypto';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { phoneContacts, smsOptIn } from '../db/schema';

export async function getPhoneForEmail(email: string): Promise<string | null> {
  const rows = await db
    .select({ phone: phoneContacts.phone })
    .from(phoneContacts)
    .where(eq(phoneContacts.email, email.toLowerCase()))
    .limit(1);

  const phone = rows[0]?.phone ?? null;
  if (!phone) return null;

  const opted = await db
    .select({ id: smsOptIn.id })
    .from(smsOptIn)
    .where(eq(smsOptIn.phone, phone))
    .limit(1);

  return opted.length > 0 ? phone : null;
}

export async function getPhonesForEmails(emails: string[]): Promise<string[]> {
  if (emails.length === 0) return [];
  const normalized = [...new Set(emails.map((e) => e.toLowerCase()))];
  const contactRows = await db
    .select({ phone: phoneContacts.phone })
    .from(phoneContacts)
    .where(inArray(phoneContacts.email, normalized));

  const phones = [...new Set(contactRows.map((r) => r.phone))];
  if (phones.length === 0) return [];

  const optedRows = await db
    .select({ phone: smsOptIn.phone })
    .from(smsOptIn)
    .where(inArray(smsOptIn.phone, phones));

  const optedSet = new Set(optedRows.map((r) => r.phone));
  return phones.filter((p) => optedSet.has(p));
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
      id: `pc_${randomUUID()}`,
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
