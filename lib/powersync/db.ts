import { PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from './schema';
import { SupabaseConnector } from './connector';

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'app_database.sqlite'
  }
});

export const setupPowerSync = async () => {
  await db.init();
  const connector = new SupabaseConnector();
  await db.connect(connector);
  return db;
};