/** @format */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { Car } from "src/cars/models/car.model";
import { CarBody } from "src/cars/models/carBody.model";
import { CarBrand } from "src/cars/models/carBrand.model";
import { CarBrandModel } from "src/cars/models/carBrandModel.model";
import { CarBrandModelEdition } from "src/cars/models/carBrandModelEdition.model";
import { CarCarOption } from "src/cars/models/carCarOption.model";
import { CarColor } from "src/cars/models/carColor.model";
import { CarEngine } from "src/cars/models/carEngine.model";
import { CarFuel } from "src/cars/models/carFuel.model";
import { CarOption } from "src/cars/models/carOption.model";
import { CarPhoto } from "src/cars/models/carPhoto.model";
import { CarTransmission } from "src/cars/models/carTransmission.model";
import { Exchange } from "src/exchange/exchange.model";
import { User } from "src/users/models/user.model";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [`.env.${process.env.NODE_ENV}`],
        }),
        SequelizeModule.forRoot({
            dialect: "postgres",
            host: process.env.DB_HOST || "localhost",
            port: Number(process.env.DB_PORT) || 5432,
            username: process.env.DB_USER || "encaruser",
            password: process.env.DB_PASSWORD || "Q1234567a@",
            database: process.env.DB_NAME || "encar",
            autoLoadModels: true, // Автоматическая загрузка моделей
            synchronize: false, // Синхронизация схемы БД (для разработки)
            models: [
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
                User,
                Exchange,
                CarOption,
                CarCarOption,
            ],
        }),
    ],
})
export class DbModule {}
