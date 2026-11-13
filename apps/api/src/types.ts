export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
  GEMINI_API_KEY?: string;
  AI: any;
  SPEECH_KEY?: string;
  SPEECH_REGION?: string;
  AUTH_MAIL_API_KEY?: string;
  AUTH_MAIL_FROM?: string;
  APP_ORIGIN?: string;
}

export interface JWTPayload {
  sub: number; // user_id
  email: string;
  is_admin: boolean;
  exp: number;
  iat: number;
  ver?: number;
}

export type Variables = {
  user: JWTPayload;
  requestId: string;
};
