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
let DocumentsController = class DocumentsController {
    constructor(documents) {
        this.documents = documents;
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
    createBusinessDocument(body) {
        return this.documents.createBusinessDocument(body);
    }
};
exports.DocumentsController = DocumentsController;
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
    (0, common_1.Post)('business'),
    (0, permissions_decorator_1.RequirePermissions)('documents.create', '*'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "createBusinessDocument", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)('documents'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map