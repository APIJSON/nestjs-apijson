import { Module } from '@nestjs/common';
import { BuilderService } from './builder.service';
import { BuilderController } from './builder.controller';

/**
 * 构建器模块
 */
@Module({
  controllers: [BuilderController],
  providers: [BuilderService],
  exports: [BuilderService],
})
export class BuilderModule {}
