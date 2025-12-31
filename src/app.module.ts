import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER, APP_PIPE, APP_GUARD } from '@nestjs/core';
import configuration, { cacheConfig, databaseConfig } from '@/config/configuration';
import { APIJSONController } from '@/controllers/apijson.controller';
import { HealthController } from '@/controllers/health.controller';
import { ParserModule } from '@/modules/parser/parser.module';
import { BuilderModule } from '@/modules/builder/builder.module';
import { VerifierModule } from '@/modules/verifier/verifier.module';
import { ExecutorModule } from '@/modules/executor/executor.module';
import { CacheModule } from '@/modules/cache/cache.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { APIJSONInterceptor } from '@/common/interceptors/apijson.interceptor';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';
import { APIJSONExceptionFilter } from '@/common/filters/apijson-exception.filter';
import { APIJSONValidationPipe } from '@/common/pipes/apijson-validation.pipe';
import { APIJSONAuthGuard } from '@/common/guards/apijson-auth.guard';
import { APIJSONRateLimitGuard } from '@/common/guards/apijson-rate-limit.guard';
import { JwtModule } from '@nestjs/jwt';

/**
 * 应用模块
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [cacheConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // JWT模块
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret', 'default-secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn', '1d') as any,
        },
        issuer: configService.get<string>('jwt.issuer', 'apijson-server'),
        audience: configService.get<string>('jwt.audience', 'apijson-client'),
      }),
      inject: [ConfigService],
    }),

    // 业务模块
    ParserModule,
    BuilderModule,
    VerifierModule,
    ExecutorModule,
    CacheModule,
    DatabaseModule,
  ],
  controllers: [
    // 控制器
    APIJSONController,
    HealthController,
  ],
  providers: [
    // 全局拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: APIJSONInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // 全局过滤器
    {
      provide: APP_FILTER,
      useClass: APIJSONExceptionFilter,
    },

    // 全局管道
    {
      provide: APP_PIPE,
      useClass: APIJSONValidationPipe,
    },

    // 全局守卫
    {
      provide: APP_GUARD,
      useClass: APIJSONRateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: APIJSONAuthGuard,
    },
  ],
})
export class AppModule {}
