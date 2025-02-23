/** @format */

import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Exchange } from "./exchange.model";
import { ExchangeService } from "./exchange.service";

@Module({
    imports: [SequelizeModule.forFeature([Exchange])],
    providers: [ExchangeService],
    exports: [ExchangeService],
})
export class ExchangeModule {}
