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
    Query,
} from "@nestjs/common";
import { CarsService } from "./cars.service";
import { FetchCarDto } from "./dto/fetch-car.dto";
import { FilterCarDto } from "./dto/filter-car.dto";
import { AuthGuard } from "src/auth/auth.guard";
import { RoleGuard } from "src/role/role.guard";
import { Roles } from "src/role/role.decorator";
import { UpdateCarDto } from "./dto/update-car.dto";

@Controller("cars")
export class CarsController {
    constructor(private readonly carsService: CarsService) {}

    @Post("filter")
    async filterCars(@Body() filterDto: FilterCarDto) {
        return this.carsService.filterCars(filterDto);
    }

    // @Get()
    // async getAllCars() {
    //     return this.carsService.getAllCars();
    // }

    @Get()
    async getAllCars(
        @Query("orderKey") orderKey?: string,
        @Query("orderValue") orderValue?: string
    ) {
        return this.carsService.getAllCars(orderKey, orderValue);
    }

    @Get(":id")
    async getCar(@Param("id") id: string) {
        return this.carsService.getCar(Number(id)); // Приводим id к числу
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles("ADMIN")
    @Post("save")
    async fetchAllCars(@Body() fetchCarDto: FetchCarDto) {
        return this.carsService.fetchAllCars(fetchCarDto);
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles("ADMIN")
    @Delete(":id")
    async deleteCar(@Param("id") id: string) {
        return this.carsService.deleteCar(Number(id));
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles("ADMIN")
    @Patch(":id")
    async updateCar(
        @Param("id") id: string,
        @Body() updateCarDto: UpdateCarDto
    ) {
        return this.carsService.updateCar(Number(id), updateCarDto);
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles("ADMIN")
    @Delete()
    async deleteAllCars() {
        return this.carsService.deleteAllCars();
    }

    // @UseGuards(AuthGuard, RoleGuard)
    // @Roles("ADMIN")
    @Post("dublicate")
    async deleteDublicate() {
        return this.carsService.deleteDublicate();
    }
}
