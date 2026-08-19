export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
  GEMINI_API_KEY?: string;
  AI: any;
}

export interface JWTPayload {
  sub: number;        // user_id
  email: string;
  is_admin: boolean;
  exp: number;
  iat: number;
}

export type Variables = {
  user: JWTPayload;
};
