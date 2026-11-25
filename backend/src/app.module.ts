import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { Env, validateEnv } from './shared/config/env.validation';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IamModule } from './modules/iam/iam.module';
import { SearchReindexModule } from './modules/search/search-reindex.module';
import { SearchModule } from './modules/search/search.module';
import { AppThrottlerGuard } from './shared/http/app-throttler.guard';
import { buildThrottlerOptions } from './shared/config/throttler.config';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        buildThrottlerOptions({
          ttlSeconds: config.get('THROTTLE_TTL_SECONDS', { infer: true }),
          limit: config.get('THROTTLE_LIMIT', { infer: true }),
          authLimit: config.get('THROTTLE_AUTH_LIMIT', { infer: true }),
        }),
    }),
    SharedModule,
    SearchModule,
    SearchReindexModule,
    CatalogModule,
    IamModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
