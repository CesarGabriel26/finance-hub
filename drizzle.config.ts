import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './electron/db/schemas/index.ts',
  out: './electron/db/migrations',
});
