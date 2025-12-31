import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  UseInterceptors,
  UsePipes,
  UseFilters,
} from '@nestjs/common';
import { APIJSONRequest, APIJSONResponse } from '@/interfaces/apijson-request.interface';
import { ParserService } from '@/modules/parser/parser.service';
import { VerifierService } from '@/modules/verifier/verifier.service';
import { BuilderService } from '@/modules/builder/builder.service';
import { ExecutorService } from '@/modules/executor/executor.service';
import { CacheService } from '@/modules/cache/cache.service';
import { APIJSONAuthGuard } from '@/common/guards/apijson-auth.guard';
import { APIJSONRateLimitGuard } from '@/common/guards/apijson-rate-limit.guard';
import { APIJSONInterceptor } from '@/common/interceptors/apijson.interceptor';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';
import { APIJSONValidationPipe } from '@/common/pipes/apijson-validation.pipe';
import { APIJSONExceptionFilter } from '@/common/filters/apijson-exception.filter';
import {
  APIJSONLog,
  APIJSONPerformance,
  APIJSONCache,
  APIJSONTransform,
  APIJSONAuth,
  APIJSONRateLimit
} from '@/common/decorators/apijson.decorator';

/**
 * APIJSON控制器
 * 负责处理APIJSON请求
 */
@Controller('apijson')
@UseGuards(APIJSONRateLimitGuard, APIJSONAuthGuard)
@UseInterceptors(LoggingInterceptor, APIJSONInterceptor)
@UsePipes(APIJSONValidationPipe)
@UseFilters(APIJSONExceptionFilter)
@APIJSONLog({ enabled: true, level: 'info' })
@APIJSONPerformance({ enabled: true })
@APIJSONCache({ enabled: true })
@APIJSONTransform({ enabled: true })
@APIJSONAuth({ enabled: true, roles: ['user', 'admin'], permissions: ['read', 'write'] })
@APIJSONRateLimit({ enabled: true, max: 100, windowMs: 15 * 60 * 1000 })
export class APIJSONController {
  constructor(
    private readonly parserService: ParserService,
    private readonly verifierService: VerifierService,
    private readonly builderService: BuilderService,
    private readonly executorService: ExecutorService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 处理APIJSON请求
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleRequest(@Body() request: APIJSONRequest): Promise<APIJSONResponse> {
    // 生成缓存键
    const cacheKey = this.generateCacheKey(request);

    // 检查缓存
    /* const cachedResponse = await this.cacheService.get(cacheKey);
    if (cachedResponse) {
      return {
        ...cachedResponse,
        cached: true,
      };
    } */

    // 解析请求
    const parseResult = await this.parserService.parse(request);
	  console.log('parseResult = ', parseResult.tables);

    // 验证请求
    const verifyResult = await this.verifierService.verify(parseResult);

    // 如果验证失败，返回错误
    if (!verifyResult.valid) {
      return {
        status: 'error',
        code: 400,
        message: '请求验证失败',
        errors: verifyResult.errors,
        warnings: verifyResult.warnings,
        processingTime: 0,
        timestamp: new Date().toISOString(),
        path: '/apijson',
        cached: false,
      };
    }

    // 构建SQL查询
    const buildResult = await this.builderService.build(parseResult);

    // 执行SQL查询
    const executeResult = await this.executorService.execute(buildResult);

    // 构建响应
    const response: APIJSONResponse = {
      status: 'success',
      code: 200,
      message: '请求成功',
      data: executeResult.data,
      warnings: verifyResult.warnings,
      processingTime: 0,
      timestamp: new Date().toISOString(),
      path: '/apijson',
      cached: false,
    };

    // 缓存响应
    await this.cacheService.set(cacheKey, response, 300000); // 5分钟

    return response;
  }

  /**
   * 获取APIJSON信息
   */
  @Get('info')
  @HttpCode(HttpStatus.OK)
  @APIJSONAuth({ enabled: false })
  async getInfo(): Promise<any> {
    return {
      name: 'APIJSON Server',
      version: '1.0.0',
      description: '基于 NestJS 的 APIJSON 服务器实现',
      features: [
        '完整的 APIJSON 语法支持',
        '强大的查询解析和验证',
        '内置认证和授权',
        '详细的日志和性能监控',
        '灵活的缓存策略',
        '完整的 API 文档',
        '全面的单元测试和集成测试',
      ],
      supportedDirectives: [
        '@method',
        '@page',
        '@limit',
        '@offset',
        '@order',
        '@search',
        '@group',
        '@cache',
        '@total',
        '@count',
      ],
      supportedDatabases: [
        'MySQL',
        'PostgreSQL',
        'SQLite',
        'SQL Server',
        'Oracle',
      ],
    };
  }

  /**
   * 获取APIJSON统计信息
   */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @APIJSONAuth({ enabled: true, roles: ['admin'], permissions: ['read'] })
  async getStats(): Promise<any> {
    // 这里应该实现统计信息获取逻辑
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      lastRequestTime: null,
      cacheHitRate: 0,
    };
  }

  /**
   * 清空缓存
   */
  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  @APIJSONAuth({ enabled: true, roles: ['admin'], permissions: ['write'] })
  async clearCache(): Promise<any> {
    await this.cacheService.flush();

    return {
      status: 'success',
      code: 200,
      message: '缓存已清空',
      processingTime: 0,
      timestamp: new Date().toISOString(),
      path: '/apijson/cache/clear',
      cached: false,
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: APIJSONRequest): string {
    // 这里应该实现缓存键生成逻辑
    // 简单实现：使用请求的哈希值
    return `apijson:${Buffer.from(JSON.stringify(request)).toString('base64')}`;
  }
}
