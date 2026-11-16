import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { validateEnv } from '../../../shared/config/env.validation';
import { SharedModule } from '../../../shared/shared.module';
import { ReindexWorkEmbeddings } from '../application/reindex-work-embeddings.use-case';
import { readReindexConfig } from '../infrastructure/reindex-config';
import { SearchModule } from '../search.module';

/** Contexto mínimo: sin servidor HTTP ni programador de intervalo. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: validateEnv,
    }),
    SharedModule,
    SearchModule,
  ],
})
class SearchReindexCliModule {}

async function main(): Promise<number> {
  const app = await NestFactory.createApplicationContext(
    SearchReindexCliModule,
    { logger: ['error', 'warn'] },
  );
  try {
    const { batchSize } = readReindexConfig(app.get(ConfigService));
    const summary = await app.get(ReindexWorkEmbeddings).execute({
      batchSize,
      maxBatches: Number.MAX_SAFE_INTEGER,
    });
    console.log(JSON.stringify(summary, null, 2));
    return summary.failed > 0 ? 1 : 0;
  } finally {
    await app.close();
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
