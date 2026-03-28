"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const documents_service_1 = require("./documents.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const platform_express_1 = require("@nestjs/platform-express");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let DocumentsController = class DocumentsController {
    constructor(documents) {
        this.documents = documents;
    }
    list(scope, query, type, traderId, businessId, skip, take) {
        if (!scope)
            throw new common_1.BadRequestException('Missing scope');
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
    search(query, type) {
        return this.documents.search({ query, type });
    }
    getTraderDocuments(traderId) {
        return this.documents.findTraderDocuments(traderId);
    }
    getBusinessDocuments(businessId) {
        return this.documents.findBusinessDocuments(businessId);
    }
    createTraderDocument(body) {
        return this.documents.createTraderDocument(body);
    }
    async uploadTrader(traderId, file, body, userId, req) {
        if (!file)
            throw new common_1.BadRequestException('Missing file');
        if (!body?.type?.trim())
            throw new common_1.BadRequestException('Missing type');
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
            userAgent: req?.headers?.['user-agent'],
        });
        return doc;
    }
    async downloadTraderDoc(id, req, res, userId) {
        const found = await this.documents.streamTraderDocumentFile(id);
        if (!found)
            throw new common_1.NotFoundException('Document not found');
        if (!found.stream)
            throw new common_1.NotFoundException('File missing on storage');
        res.setHeader('Content-Type', found.doc.mimeType ?? 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(found.doc.name)}"`);
        await this.documents.logAudit({
            userId,
            action: 'download',
            entity: 'TraderDocument',
            entityId: id,
            ipAddress: req?.ip,
            userAgent: req?.headers?.['user-agent'],
        });
        return found.stream.pipe(res);
    }
    async viewTraderDoc(id, req, res, userId) {
        const found = await this.documents.streamTraderDocumentFile(id);
        if (!found)
            throw new common_1.NotFoundException('Document not found');
        if (!found.stream)
            throw new common_1.NotFoundException('File missing on storage');
        res.setHeader('Content-Type', found.doc.mimeType ?? 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(found.doc.name)}"`);
        await this.documents.logAudit({
            userId,
            action: 'view',
            entity: 'TraderDocument',
            entityId: id,
            ipAddress: req?.ip,
            userAgent: req?.headers?.['user-agent'],
        });
        return found.stream.pipe(res);
    }
    async updateTraderDocMeta(id, body, userId, req) {
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
            userAgent: req?.headers?.['user-agent'],
        });
        return updated;
    }
    async deleteTraderDoc(id, userId, req) {
        const doc = await this.documents.getTraderDocument(id);
        const result = await this.documents.deleteTraderDocument(id);
        await this.documents.logAudit({
            userId,
            action: 'delete',
            entity: 'TraderDocument',
            entityId: id,
            oldValue: doc ? { traderId: doc.traderId, type: doc.type, name: doc.name, filePath: doc.filePath } : undefined,
            ipAddress: req?.ip,
            userAgent: req?.headers?.['user-agent'],
        });
        return result;
    }
    createBusinessDocument(body) {
        return this.documents.createBusinessDocument(body);
    }
    async uploadBusiness(businessId, file, body, userId, req) {
        if (!file)
            throw new common_1.BadRequestException('Missing file');
        if (!body?.type?.trim())
            throw new common_1.BadRequestException('Missing type');
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
            userAgent: req?.headers?.['user-agent'],
        });
        return doc;
    }
    async downloadBusinessDoc(id, req, res, userId) {
        const found = await this.documents.streamBusinessDocumentFile(id);
        if (!found)
            throw new common_1.NotFoundException('Document not found');
        if (!found.stream)
            throw new common_1.NotFoundException('File missing on storage');
        res.setHeader('Content-Type', found.doc.mimeType ?? 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(found.doc.name)}"`);
        await this.documents.logAudit({
            userId,
            action: 'download',
            entity: 'BusinessDocument',
            entityId: id,
            ipAddress: req?.ip,
            userAgent: req?.headers?.['user-agent'],
        });
        return found.stream.pipe(res);
    }
    async viewBusinessDoc(id, req, res, userId) {
        const found = await this.documents.streamBusinessDocumentFile(id);
        if (!found)
            throw new common_1.NotFoundException('Document not found');
        if (!found.stream)
            throw new common_1.NotFoundException('File missing on storage');
        res.setHeader('Content-Type', found.doc.mimeType ?? 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(found.doc.name)}"`);
        await this.documents.logAudit({
            userId,
            action: 'view',
            entity: 'BusinessDocument',
            entityId: id,
            ipAddress: req?.ip,
            userAgent: req?.headers?.['user-agent'],
        });
        return found.stream.pipe(res);
    }
    async updateBusinessDocMeta(id, body, userId, req) {
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
            userAgent: req?.headers?.['user-agent'],
        });
        return updated;
    }
    async deleteBusinessDoc(id, userId, req) {
        const doc = await this.documents.getBusinessDocument(id);
        const result = await this.documents.deleteBusinessDocument(id);
        await this.documents.logAudit({
            userId,
            action: 'delete',
            entity: 'BusinessDocument',
            entityId: id,
            oldValue: doc ? { businessId: doc.businessId, type: doc.type, name: doc.name, filePath: doc.filePath } : undefined,
            ipAddress: req?.ip,
            userAgent: req?.headers?.['user-agent'],
        });
        return result;
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)('list'),
    (0, permissions_decorator_1.RequirePermissions)('documents.read', '*'),
    __param(0, (0, common_1.Query)('scope')),
    __param(1, (0, common_1.Query)('query')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('traderId')),
    __param(4, (0, common_1.Query)('businessId')),
    __param(5, (0, common_1.Query)('skip')),
    __param(6, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, permissions_decorator_1.RequirePermissions)('documents.read', '*'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('trader/:traderId'),
    (0, permissions_decorator_1.RequirePermissions)('documents.read', '*'),
    __param(0, (0, common_1.Param)('traderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getTraderDocuments", null);
__decorate([
    (0, common_1.Get)('business/:businessId'),
    (0, permissions_decorator_1.RequirePermissions)('documents.read', '*'),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getBusinessDocuments", null);
__decorate([
    (0, common_1.Post)('trader'),
    (0, permissions_decorator_1.RequirePermissions)('documents.create', '*'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "createTraderDocument", null);
__decorate([
    (0, common_1.Post)('trader/:traderId/upload'),
    (0, permissions_decorator_1.RequirePermissions)('documents.create', '*'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 25 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('traderId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "uploadTrader", null);
__decorate([
    (0, common_1.Get)('trader-doc/:id/download'),
    (0, permissions_decorator_1.RequirePermissions)('documents.read', '*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "downloadTraderDoc", null);
__decorate([
    (0, common_1.Get)('trader-doc/:id/view'),
    (0, permissions_decorator_1.RequirePermissions)('documents.read', '*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "viewTraderDoc", null);
__decorate([
    (0, common_1.Put)('trader-doc/:id'),
    (0, permissions_decorator_1.RequirePermissions)('documents.update', '*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "updateTraderDocMeta", null);
__decorate([
    (0, common_1.Delete)('trader-doc/:id'),
    (0, permissions_decorator_1.RequirePermissions)('documents.delete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "deleteTraderDoc", null);
__decorate([
    (0, common_1.Post)('business'),
    (0, permissions_decorator_1.RequirePermissions)('documents.create', '*'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "createBusinessDocument", null);
__decorate([
    (0, common_1.Post)('business/:businessId/upload'),
    (0, permissions_decorator_1.RequirePermissions)('documents.create', '*'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 25 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "uploadBusiness", null);
__decorate([
    (0, common_1.Get)('business-doc/:id/download'),
    (0, permissions_decorator_1.RequirePermissions)('documents.read', '*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "downloadBusinessDoc", null);
__decorate([
    (0, common_1.Get)('business-doc/:id/view'),
    (0, permissions_decorator_1.RequirePermissions)('documents.read', '*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "viewBusinessDoc", null);
__decorate([
    (0, common_1.Put)('business-doc/:id'),
    (0, permissions_decorator_1.RequirePermissions)('documents.update', '*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "updateBusinessDocMeta", null);
__decorate([
    (0, common_1.Delete)('business-doc/:id'),
    (0, permissions_decorator_1.RequirePermissions)('documents.delete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "deleteBusinessDoc", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)('documents'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map