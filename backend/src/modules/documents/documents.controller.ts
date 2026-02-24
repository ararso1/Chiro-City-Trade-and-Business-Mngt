import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Get('search')
  @RequirePermissions('documents.read', '*')
  search(@Query('query') query?: string, @Query('type') type?: string) {
    return this.documents.search({ query, type });
  }

  @Get('trader/:traderId')
  @RequirePermissions('documents.read', '*')
  getTraderDocuments(@Param('traderId') traderId: string) {
    return this.documents.findTraderDocuments(traderId);
  }

  @Get('business/:businessId')
  @RequirePermissions('documents.read', '*')
  getBusinessDocuments(@Param('businessId') businessId: string) {
    return this.documents.findBusinessDocuments(businessId);
  }

  @Post('trader')
  @RequirePermissions('documents.create', '*')
  createTraderDocument(
    @Body() body: { traderId: string; name: string; type: string; filePath: string; mimeType?: string; sizeBytes?: number },
  ) {
    return this.documents.createTraderDocument(body);
  }

  @Post('business')
  @RequirePermissions('documents.create', '*')
  createBusinessDocument(
    @Body()
    body: {
      businessId: string;
      name: string;
      type: string;
      filePath: string;
      mimeType?: string;
      sizeBytes?: number;
    },
  ) {
    return this.documents.createBusinessDocument(body);
  }
}
