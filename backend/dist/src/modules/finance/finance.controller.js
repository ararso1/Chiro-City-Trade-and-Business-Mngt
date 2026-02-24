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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const finance_service_1 = require("./finance.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let FinanceController = class FinanceController {
    constructor(finance) {
        this.finance = finance;
    }
    getTaxTypes() {
        return this.finance.getTaxTypes();
    }
    getPayments(businessId, year, status, skip, take) {
        return this.finance.getPayments({
            businessId,
            year: year ? parseInt(year, 10) : undefined,
            status,
            skip: skip ? parseInt(skip, 10) : undefined,
            take: take ? parseInt(take, 10) : undefined,
        });
    }
    getRevenueSummary(year) {
        return this.finance.getRevenueSummary(year ? parseInt(year, 10) : undefined);
    }
    recordPayment(body) {
        return this.finance.recordPayment(body);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('tax-types'),
    (0, permissions_decorator_1.RequirePermissions)('payments.read', 'finance.read', '*'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getTaxTypes", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, permissions_decorator_1.RequirePermissions)('payments.read', 'finance.read', '*'),
    __param(0, (0, common_1.Query)('businessId')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('skip')),
    __param(4, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Get)('revenue'),
    (0, permissions_decorator_1.RequirePermissions)('payments.read', 'reports.read', '*'),
    __param(0, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getRevenueSummary", null);
__decorate([
    (0, common_1.Post)('payments'),
    (0, permissions_decorator_1.RequirePermissions)('payments.create', 'finance.write', '*'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "recordPayment", null);
exports.FinanceController = FinanceController = __decorate([
    (0, swagger_1.ApiTags)('finance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('finance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map