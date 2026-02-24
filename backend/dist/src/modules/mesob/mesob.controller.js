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
exports.MesobController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mesob_service_1 = require("./mesob.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let MesobController = class MesobController {
    constructor(mesob) {
        this.mesob = mesob;
    }
    pushTrader(id) {
        return this.mesob.pushToMesob('trader', id);
    }
    pushBusiness(id) {
        return this.mesob.pushToMesob('business', id);
    }
};
exports.MesobController = MesobController;
__decorate([
    (0, common_1.Post)('sync/trader/:id'),
    (0, permissions_decorator_1.RequirePermissions)('*'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MesobController.prototype, "pushTrader", null);
__decorate([
    (0, common_1.Post)('sync/business/:id'),
    (0, permissions_decorator_1.RequirePermissions)('*'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MesobController.prototype, "pushBusiness", null);
exports.MesobController = MesobController = __decorate([
    (0, swagger_1.ApiTags)('mesob'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('mesob'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [mesob_service_1.MesobService])
], MesobController);
//# sourceMappingURL=mesob.controller.js.map