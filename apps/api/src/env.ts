import { config } from 'dotenv';

config();

process.env.PORT ??= '3000';
process.env.DATABASE_URL ??= 'postgresql://bulki:bulki@localhost:5432/bulki_bull?schema=public';
