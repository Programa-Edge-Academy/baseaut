import { PowerSyncBackendConnector } from '@powersync/react-native';
import { supabase } from '../supabase';

export class SupabaseConnector implements PowerSyncBackendConnector {
  
  async fetchCredentials() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) return null;

    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL || '', 
      token: session.access_token,
    };
  }

  async uploadData(database: any) {
    // Implementaremos as mutações (insert/update/delete) nos próximos épicos
  }
}