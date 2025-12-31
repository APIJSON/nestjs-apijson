import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

/**
 * 应用程序入口
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // 创建应用
    const app = await NestFactory.create(AppModule);

    // 获取配置服务
    const configService = app.get(ConfigService);

    // 启用CORS
    app.enableCors({
      origin: configService.get<string>('cors.origin', '*'),
      methods: configService.get<string>('cors.methods', 'GET,HEAD,PUT,PATCH,POST,DELETE'),
      credentials: configService.get<boolean>('cors.credentials', true),
    });

    // 启用全局验证管道
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // 设置全局前缀
    const globalPrefix = configService.get<string>('app.globalPrefix', 'api');
    app.setGlobalPrefix(globalPrefix);

    // 配置Swagger文档
    if (configService.get<boolean>('swagger.enabled', true) || true) {
      const options = new DocumentBuilder()
        .setTitle(configService.get<string>('swagger.title', 'APIJSON Server API'))
        .setDescription(configService.get<string>('swagger.description', '基于 NestJS 的 APIJSON 服务器实现'))
        .setVersion(configService.get<string>('swagger.version', '1.0.0'))
        .addTag('apijson', 'APIJSON接口')
        .addTag('health', '健康检查接口')
        .addTag('cache', '缓存接口')
        .addTag('parser', '解析器接口')
        .addTag('builder', '构建器接口')
        .addTag('verifier', '验证器接口')
        .addTag('executor', '执行器接口')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, options);
      SwaggerModule.setup(
        configService.get<string>('swagger.path', 'docs'),
        app,
        document,
        {
          customSiteTitle: configService.get<string>('swagger.title', 'APIJSON Server API'),
          customCss: configService.get<string>('swagger.customCss', ''),
          customJs: configService.get<string>('swagger.customJs', ''),
        },
      );

      logger.log(`Swagger文档已启用: /${globalPrefix}/${configService.get<string>('swagger.path', 'docs')}`);
      console.log(`Swagger文档已启用: /${globalPrefix}/${configService.get<string>('swagger.path', 'docs')}`);
    }

    // 启动应用
    const port = configService.get<number>('app.port', 5500);
    const host = configService.get<string>('app.host', '0.0.0.0');

    await app.listen(port, host, ()=>{
	    console.log(`http://127.0.0.1:${port}`);
    });

    logger.log(`应用程序已启动: http://${host}:${port}/${globalPrefix}`);
    logger.log(`环境: ${configService.get<string>('app.environment', 'development')}`);
    logger.log(`版本: ${configService.get<string>('app.version', '1.0.0')}`);

    // 优雅关闭
    app.enableShutdownHooks();

    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常', error.stack);
      process.exit(1);
    });

    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝', { reason, promise });
      process.exit(1);
    });

    // 处理SIGTERM信号
    process.on('SIGTERM', () => {
      logger.log('收到SIGTERM信号，开始优雅关闭...');
      app.close().then(() => {
        logger.log('应用程序已优雅关闭');
        process.exit(0);
      });
    });

    // 处理SIGINT信号
    process.on('SIGINT', () => {
      logger.log('收到SIGINT信号，开始优雅关闭...');
      app.close().then(() => {
        logger.log('应用程序已优雅关闭');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('应用程序启动失败', error.stack);
    process.exit(1);
  }
}

// 启动应用程序
bootstrap();
