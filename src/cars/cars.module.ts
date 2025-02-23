/** @format */

import { Module } from "@nestjs/common";
import { CarsService } from "./cars.service";
import { CarsController } from "./cars.controller";
import { ApiModule } from "src/api/api.module";
import { SequelizeModule } from "@nestjs/sequelize";
import { Car } from "./models/car.model";
import { CarPhoto } from "./models/carPhoto.model";
import { CarTransmission } from "./models/carTransmission.model";
import { CarFuel } from "./models/carFuel.model";
import { CarEngine } from "./models/carEngine.model";
import { CarColor } from "./models/carColor.model";
import { CarBody } from "./models/carBody.model";
import { CarBrandModelEdition } from "./models/carBrandModelEdition.model";
import { CarBrandModel } from "./models/carBrandModel.model";
import { CarBrand } from "./models/carBrand.model";
import { CarOption } from "./models/carOption.model";
import { CarCarOption } from "./models/carCarOption.model";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "src/auth/auth.module";
import { Exchange } from "src/exchange/exchange.model";
import { ExchangeModule } from "src/exchange/exchange.module";

@Module({
    imports: [
        SequelizeModule.forFeature([
            Car,
            CarBrand,
            CarBrandModel,
            CarBrandModelEdition,
            CarBody,
            CarColor,
            CarEngine,
            CarFuel,
            CarTransmission,
            CarPhoto,
            CarOption,
            CarCarOption,
            Exchange,
        ]),
        AuthModule,
        ApiModule,
        ExchangeModule,
    ],
    controllers: [CarsController],
    providers: [CarsService],
    exports: [CarsService],
})
export class CarsModule {}
