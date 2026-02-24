import { Module } from '@nestjs/common';
import { TradersController } from './traders.controller';
import { TradersService } from './traders.service';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [FiscalYearModule],
  controllers: [TradersController],
  providers: [TradersService],
  exports: [TradersService],
})
export class TradersModule {}
