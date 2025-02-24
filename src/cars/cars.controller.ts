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
import { CarsService } from "./cars.service";
import { FetchCarDto } from "./dto/fetch-car.dto";
import { FilterCarDto } from "./dto/filter-car.dto";
import { AuthGuard } from "src/auth/auth.guard";
import { RoleGuard } from "src/role/role.guard";
import { Roles } from "src/role/role.decorator";
import { UpdateCarDto } from "./dto/update-car.dto";
import { MinYearCarsDto } from "./dto/min-year-cars.dto";
import { MaxYearCarsDto } from "./dto/max-year-cars.dto";
import { MinEngineCarsDto } from "./dto/min-engine.dto";
import { MaxEngineCarsDto } from "./dto/max-engine.dto";
import { MinMileageCarsDto } from "./dto/min-mileage.dto";
import { MaxMileageCarsDto } from "./dto/max-mileage.dto";
import { TransmissionCarsDto } from "./dto/transmission.dto";
import { BodyCarsDto } from "./dto/body.dto";

@Controller("api/cars")
export class CarsController {
    constructor(private readonly carsService: CarsService) {}

    @Post("filter")
    async filterCars(@Body() filterDto: FilterCarDto) {
        return this.carsService.filterCars(filterDto);
    }

    @Get()
    async getAllCars() {
        return this.carsService.getAllCars();
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
