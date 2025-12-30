import { Module } from '@nestjs/common';
import { ExecutorService } from './executor.service';
import { ExecutorController } from './executor.controller';

/**
 * 执行器模块
 */
@Module({
  controllers: [ExecutorController],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}
