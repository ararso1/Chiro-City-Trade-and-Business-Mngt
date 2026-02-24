import { Module } from '@nestjs/common';
import { MesobController } from './mesob.controller';
import { MesobService } from './mesob.service';

@Module({
  controllers: [MesobController],
  providers: [MesobService],
  exports: [MesobService],
})
export class MesobModule {}
