"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalYearModule = void 0;
const common_1 = require("@nestjs/common");
const fiscal_year_controller_1 = require("./fiscal-year.controller");
const fiscal_year_service_1 = require("./fiscal-year.service");
let FiscalYearModule = class FiscalYearModule {
};
exports.FiscalYearModule = FiscalYearModule;
exports.FiscalYearModule = FiscalYearModule = __decorate([
    (0, common_1.Module)({
        controllers: [fiscal_year_controller_1.FiscalYearController],
        providers: [fiscal_year_service_1.FiscalYearService],
        exports: [fiscal_year_service_1.FiscalYearService],
    })
], FiscalYearModule);
//# sourceMappingURL=fiscal-year.module.js.map