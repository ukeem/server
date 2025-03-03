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
import { BrandIdsDto } from "./dto/brand-dto";
import { BrandIdsAndModelIdsDto } from "./dto/edition-dto";

@Controller("cars")
export class CarsController {
    constructor(private readonly carsService: CarsService) {}

    @Post("filter")
    async filterCars(@Body() filterDto: FilterCarDto) {
        return this.carsService.filterCars(filterDto);
    }

    @Post("count")
    async filterCountCars(@Body() filterDto: FilterCarDto) {
        return this.carsService.filterCountCars(filterDto);
    }
    @Get("getfilter")
    async getAllCarsForFilter() {
        return this.carsService.getAllCarsForFilter();
    }

    @Get("count-all")
    async getCountCars() {
        return this.carsService.getCountCars();
    }

    @Get("brands")
    async getBrands() {
        return this.carsService.getBrands();
    }

    @Post("models")
    async getModelsByBrandIds(@Body() dto: BrandIdsDto) {
        return this.carsService.getModelsByBrandIds(dto);
    }

    @Post("editions")
    async getEditionsByModelIds(@Body() dto: BrandIdsAndModelIdsDto) {
        return this.carsService.getEditionsByModelIds(dto);
    }

    @Get("min-max-year")
    async getMinMaxYear() {
        return this.carsService.getMinMaxYear();
    }
    @Get("min-max-engine")
    async getMinMaxEngine() {
        return this.carsService.getMinMaxEngine();
    }

    @Get("min-max-mileage")
    async getMinMaxMileage() {
        return this.carsService.getMinMaxMileage();
    }
    @Get("min-max-price")
    async getMinMaxPrice() {
        return this.carsService.getMinMaxPrice();
    }

    @Get("transmissions")
    async getTransmissions() {
        return this.carsService.getTransmissions();
    }

    @Get("fuel")
    async getFuel() {
        return this.carsService.getFuel();
    }
    @Get("color")
    async getColor() {
        return this.carsService.getColor();
    }
    @Get("body")
    async getBodies() {
        return this.carsService.getBodies();
    }

    @Get("option")
    async getOptions() {
        return this.carsService.getOptions();
    }

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
    @Post("find")
    async findNewCars() {
        return this.carsService.findNewCars();
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
