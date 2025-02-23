/** @format */

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthGuard } from "./auth.guard";
import { JwtStrategy } from "./jwt.strategy";

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: "24h" }, // Время жизни токена
        }),
    ],
    providers: [AuthGuard, JwtStrategy],
    exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
