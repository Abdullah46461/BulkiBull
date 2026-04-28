import { config } from 'dotenv';

config();

process.env.PORT ??= '3000';
process.env.DATABASE_URL ??= 'postgresql://bulki:bulki@localhost:5432/bulki_bull?schema=public';
process.env.AUTH_SESSION_TTL_DAYS ??= '30';
process.env.API_PUBLIC_URL ??= `http://localhost:${process.env.PORT}`;
process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES ??= '1440';
