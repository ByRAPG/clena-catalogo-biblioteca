import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './shared/config/env.validation';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IamModule } from './modules/iam/iam.module';
import { SearchModule } from './modules/search/search.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      validate: validateEnv,
    }),
    SharedModule,
    SearchModule,
    CatalogModule,
    IamModule,
  ],
})
export class AppModule {}
