import { Module } from '@nestjs/common';
import { ExecutorService } from './executor.service';
import { ExecutorController } from './executor.controller';
import { DatabaseModule } from '../database/database.module';

/**
 * 执行器模块
 */
@Module({
  imports: [DatabaseModule],
  controllers: [ExecutorController],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}
