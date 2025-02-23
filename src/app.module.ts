/** @format */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CarsModule } from "./cars/cars.module";
import { ApiService } from "./api/api.service";
import { ApiModule } from "./api/api.module";
import { DbModule } from "./db/db.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ExchangeService } from "./exchange/exchange.service";
import { ExchangeModule } from "./exchange/exchange.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [`.env.${process.env.NODE_ENV}`],
            isGlobal: true,
        }),
        DbModule,
        CarsModule,
        ApiModule,
        DbModule,
        UsersModule,
        AuthModule,
        ExchangeModule,
    ],
    controllers: [],
    providers: [ApiService],
})
export class AppModule {}
