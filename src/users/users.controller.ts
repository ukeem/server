/** @format */

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AuthGuard } from "src/auth/auth.guard";
import { RoleGuard } from "src/role/role.guard";
import { Roles } from "src/role/role.decorator";

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post("register")
    register(@Body() createUserDto: CreateUserDto) {
        return this.usersService.register(createUserDto);
    }

    @Post("login")
    login(@Body() loginUserDto: LoginUserDto) {
        return this.usersService.login(loginUserDto);
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles("ADMIN")
    @Get("users")
    getAllUsers() {
        return this.usersService.getAllUsers();
    }

    @UseGuards(AuthGuard)
    @Get("user/:id")
    getUser(@Param("id") id: string) {
        return this.usersService.getUser(Number(id));
    }

    @UseGuards(AuthGuard)
    @Patch("user/:id")
    updateUser(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.updateUser(Number(id), updateUserDto);
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles("ADMIN")
    @Delete("user/:id")
    deleteUser(@Param("id") id: string) {
        return this.usersService.deleteUser(Number(id));
    }
}
