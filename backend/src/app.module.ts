import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TradersModule } from './modules/traders/traders.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { LicensesModule } from './modules/licenses/licenses.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MesobModule } from './modules/mesob/mesob.module';
import { FiscalYearModule } from './modules/fiscal-year/fiscal-year.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TradersModule,
    BusinessesModule,
    LicensesModule,
    FinanceModule,
    InspectionsModule,
    DocumentsModule,
    ComplaintsModule,
    NotificationsModule,
    ReportsModule,
    MesobModule,
    FiscalYearModule,
  ],
})
export class AppModule {}
