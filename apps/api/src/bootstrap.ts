import './env';
import 'reflect-metadata';

import { PHOTO_DATA_URL_MAX_LENGTH } from '@bulki-bull/shared';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

const JSON_BODY_LIMIT_BYTES = PHOTO_DATA_URL_MAX_LENGTH + 64 * 1024;

export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // The mobile MVP stores a compressed data URL in `photoUrl`, so the parser
  // needs headroom for the image plus the rest of the JSON form payload.
  app.useBodyParser('json', {
    limit: JSON_BODY_LIMIT_BYTES,
  });
  app.useBodyParser('urlencoded', {
    extended: true,
    limit: JSON_BODY_LIMIT_BYTES,
  });

  app.enableCors({
    origin: true,
  });

  return app;
}

export async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT);

  await app.listen(port);
}
