import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Req, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Get('list')
  @RequirePermissions('documents.read', '*')
  list(
    @Query('scope') scope?: 'trader' | 'business',
    @Query('query') query?: string,
    @Query('type') type?: string,
    @Query('traderId') traderId?: string,
    @Query('businessId') businessId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    if (!scope) throw new BadRequestException('Missing scope');
    return this.documents.list({
      scope,
      query,
      type,
      traderId,
      businessId,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

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

  @Post('trader/:traderId/upload')
  @RequirePermissions('documents.create', '*')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
    }),
  )
  async uploadTrader(
    @Param('traderId') traderId: string,
    @UploadedFile() file: any,
    @Body() body: { name?: string; type: string },
    @CurrentUser('sub') userId?: string,
    @Req() req?: Request,
  ) {
    if (!file) throw new BadRequestException('Missing file');
    if (!body?.type?.trim()) throw new BadRequestException('Missing type');
    const doc = await this.documents.uploadTraderDocument({
      traderId,
      name: body.name,
      type: body.type,
      file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size },
    });
    await this.documents.logAudit({
      userId,
      action: 'upload',
      entity: 'TraderDocument',
      entityId: doc.id,
      newValue: { traderId, type: body.type, name: body.name ?? file.originalname, sizeBytes: file.size, mimeType: file.mimetype },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return doc;
  }

  @Get('trader-doc/:id/download')
  @RequirePermissions('documents.read', '*')
  async downloadTraderDoc(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser('sub') userId?: string,
  ) {
    const found = await this.documents.streamTraderDocumentFile(id);
    if (!found) throw new NotFoundException('Document not found');
    if (!found.stream) throw new NotFoundException('File missing on storage');
    res.setHeader('Content-Type', found.doc.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(found.doc.name)}"`);
    await this.documents.logAudit({
      userId,
      action: 'download',
      entity: 'TraderDocument',
      entityId: id,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return found.stream.pipe(res);
  }

  @Get('trader-doc/:id/view')
  @RequirePermissions('documents.read', '*')
  async viewTraderDoc(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser('sub') userId?: string,
  ) {
    const found = await this.documents.streamTraderDocumentFile(id);
    if (!found) throw new NotFoundException('Document not found');
    if (!found.stream) throw new NotFoundException('File missing on storage');
    res.setHeader('Content-Type', found.doc.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(found.doc.name)}"`);
    await this.documents.logAudit({
      userId,
      action: 'view',
      entity: 'TraderDocument',
      entityId: id,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return found.stream.pipe(res);
  }

  @Put('trader-doc/:id')
  @RequirePermissions('documents.update', '*')
  async updateTraderDocMeta(
    @Param('id') id: string,
    @Body() body: { name?: string; type?: string },
    @CurrentUser('sub') userId?: string,
    @Req() req?: Request,
  ) {
    const before = await this.documents.getTraderDocument(id);
    const updated = await this.documents.updateTraderDocumentMeta(id, body);
    await this.documents.logAudit({
      userId,
      action: 'update',
      entity: 'TraderDocument',
      entityId: id,
      oldValue: before ? { name: before.name, type: before.type } : undefined,
      newValue: { name: updated.name, type: updated.type },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return updated;
  }

  @Delete('trader-doc/:id')
  @RequirePermissions('documents.delete')
  async deleteTraderDoc(
    @Param('id') id: string,
    @CurrentUser('sub') userId?: string,
    @Req() req?: Request,
  ) {
    const doc = await this.documents.getTraderDocument(id);
    const result = await this.documents.deleteTraderDocument(id);
    await this.documents.logAudit({
      userId,
      action: 'delete',
      entity: 'TraderDocument',
      entityId: id,
      oldValue: doc ? { traderId: doc.traderId, type: doc.type, name: doc.name, filePath: doc.filePath } : undefined,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return result;
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

  @Post('business/:businessId/upload')
  @RequirePermissions('documents.create', '*')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadBusiness(
    @Param('businessId') businessId: string,
    @UploadedFile() file: any,
    @Body() body: { name?: string; type: string },
    @CurrentUser('sub') userId?: string,
    @Req() req?: Request,
  ) {
    if (!file) throw new BadRequestException('Missing file');
    if (!body?.type?.trim()) throw new BadRequestException('Missing type');
    const doc = await this.documents.uploadBusinessDocument({
      businessId,
      name: body.name,
      type: body.type,
      file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size },
    });
    await this.documents.logAudit({
      userId,
      action: 'upload',
      entity: 'BusinessDocument',
      entityId: doc.id,
      newValue: { businessId, type: body.type, name: body.name ?? file.originalname, sizeBytes: file.size, mimeType: file.mimetype },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return doc;
  }

  @Get('business-doc/:id/download')
  @RequirePermissions('documents.read', '*')
  async downloadBusinessDoc(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser('sub') userId?: string,
  ) {
    const found = await this.documents.streamBusinessDocumentFile(id);
    if (!found) throw new NotFoundException('Document not found');
    if (!found.stream) throw new NotFoundException('File missing on storage');
    res.setHeader('Content-Type', found.doc.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(found.doc.name)}"`);
    await this.documents.logAudit({
      userId,
      action: 'download',
      entity: 'BusinessDocument',
      entityId: id,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return found.stream.pipe(res);
  }

  @Get('business-doc/:id/view')
  @RequirePermissions('documents.read', '*')
  async viewBusinessDoc(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser('sub') userId?: string,
  ) {
    const found = await this.documents.streamBusinessDocumentFile(id);
    if (!found) throw new NotFoundException('Document not found');
    if (!found.stream) throw new NotFoundException('File missing on storage');
    res.setHeader('Content-Type', found.doc.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(found.doc.name)}"`);
    await this.documents.logAudit({
      userId,
      action: 'view',
      entity: 'BusinessDocument',
      entityId: id,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return found.stream.pipe(res);
  }

  @Put('business-doc/:id')
  @RequirePermissions('documents.update', '*')
  async updateBusinessDocMeta(
    @Param('id') id: string,
    @Body() body: { name?: string; type?: string },
    @CurrentUser('sub') userId?: string,
    @Req() req?: Request,
  ) {
    const before = await this.documents.getBusinessDocument(id);
    const updated = await this.documents.updateBusinessDocumentMeta(id, body);
    await this.documents.logAudit({
      userId,
      action: 'update',
      entity: 'BusinessDocument',
      entityId: id,
      oldValue: before ? { name: before.name, type: before.type } : undefined,
      newValue: { name: updated.name, type: updated.type },
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return updated;
  }

  @Delete('business-doc/:id')
  @RequirePermissions('documents.delete')
  async deleteBusinessDoc(
    @Param('id') id: string,
    @CurrentUser('sub') userId?: string,
    @Req() req?: Request,
  ) {
    const doc = await this.documents.getBusinessDocument(id);
    const result = await this.documents.deleteBusinessDocument(id);
    await this.documents.logAudit({
      userId,
      action: 'delete',
      entity: 'BusinessDocument',
      entityId: id,
      oldValue: doc ? { businessId: doc.businessId, type: doc.type, name: doc.name, filePath: doc.filePath } : undefined,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] as string | undefined,
    });
    return result;
  }
}
