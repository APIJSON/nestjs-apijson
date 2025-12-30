import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ParserController } from './parser.controller';

/**
 * 解析器模块
 */
@Module({
  controllers: [ParserController],
  providers: [ParserService],
  exports: [ParserService],
})
export class ParserModule {}
