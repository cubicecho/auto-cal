import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index.ts';

await migrate(db, {
  migrationsFolder: './drizzle/',
});

console.log('Migrations complete');
