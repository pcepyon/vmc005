import { z } from 'zod';
import type { AppConfig } from '@/backend/hono/context';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NAVER_SEARCH_CLIENT_ID: z.string().min(1),
  NAVER_SEARCH_CLIENT_SECRET: z.string().min(1),
  NCP_CLIENT_ID: z.string().min(1),
  NCP_CLIENT_SECRET: z.string().min(1),
});

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NAVER_SEARCH_CLIENT_ID: process.env.NAVER_SEARCH_CLIENT_ID,
    NAVER_SEARCH_CLIENT_SECRET: process.env.NAVER_SEARCH_CLIENT_SECRET,
    NCP_CLIENT_ID: process.env.NCP_CLIENT_ID,
    NCP_CLIENT_SECRET: process.env.NCP_CLIENT_SECRET,
  });

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid backend configuration: ${messages}`);
  }

  cachedConfig = {
    supabase: {
      url: parsed.data.SUPABASE_URL,
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    },
    naver: {
      searchClientId: parsed.data.NAVER_SEARCH_CLIENT_ID,
      searchClientSecret: parsed.data.NAVER_SEARCH_CLIENT_SECRET,
      ncpClientId: parsed.data.NCP_CLIENT_ID,
      ncpClientSecret: parsed.data.NCP_CLIENT_SECRET,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
