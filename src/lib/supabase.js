import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

const envUrl =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) ||
  extra.supabaseUrl ||
  '';
const envKey =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  extra.supabaseAnonKey ||
  '';

export const supabaseConfigured = Boolean(String(envUrl).trim() && String(envKey).trim());

/**
 * createClient('', key) lanza "supabaseUrl is required" al cargar el módulo
 * y la app nunca registra "main". Usamos placeholders solo para poder importar;
 * las pantallas deben comprobar supabaseConfigured antes de usar la API.
 */
const PLACEHOLDER_URL = 'https://configure-env.supabase.co';
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder';

const supabaseUrl = supabaseConfigured ? envUrl.trim() : PLACEHOLDER_URL;
const supabaseAnonKey = supabaseConfigured ? envKey.trim() : PLACEHOLDER_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
