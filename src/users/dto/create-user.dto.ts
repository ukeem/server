/** @format */

import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserRole } from "../users.interface";

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
