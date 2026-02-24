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
exports.FiscalYearController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fiscal_year_service_1 = require("./fiscal-year.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let FiscalYearController = class FiscalYearController {
    constructor(fiscalYear) {
        this.fiscalYear = fiscalYear;
    }
    getConfig() {
        return this.fiscalYear.getConfig();
    }
    getActiveRange() {
        return this.fiscalYear.getActiveDateRange();
    }
    setConfig(body) {
        return this.fiscalYear.setConfig(body.calendarType ?? 'GC', body.activeFiscalYearId ?? null);
    }
    list(calendarType) {
        return this.fiscalYear.listFiscalYears(calendarType === 'EC' || calendarType === 'GC' ? calendarType : undefined);
    }
    create(body) {
        return this.fiscalYear.createFiscalYear({
            ...body,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
        });
    }
    update(id, body) {
        const data = { ...body };
        if (body.startDate)
            data.startDate = new Date(body.startDate);
        if (body.endDate)
            data.endDate = new Date(body.endDate);
        return this.fiscalYear.updateFiscalYear(id, data);
    }
    delete(id) {
        return this.fiscalYear.deleteFiscalYear(id);
    }
};
exports.FiscalYearController = FiscalYearController;
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FiscalYearController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Get)('active-range'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FiscalYearController.prototype, "getActiveRange", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('*'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FiscalYearController.prototype, "setConfig", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('calendarType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FiscalYearController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('*'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FiscalYearController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('*'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FiscalYearController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('*'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FiscalYearController.prototype, "delete", null);
exports.FiscalYearController = FiscalYearController = __decorate([
    (0, swagger_1.ApiTags)('fiscal-year'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('fiscal-year'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [fiscal_year_service_1.FiscalYearService])
], FiscalYearController);
//# sourceMappingURL=fiscal-year.controller.js.map