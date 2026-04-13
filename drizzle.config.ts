import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/core/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
