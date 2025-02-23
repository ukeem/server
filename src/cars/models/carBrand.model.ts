/** @format */

import {
    Column,
    Model,
    Table,
    PrimaryKey,
    AutoIncrement,
    Unique,
    HasMany,
    AllowNull,
} from "sequelize-typescript";
import { Car } from "./car.model";
import { CarBrandModel } from "./carBrandModel.model";

interface CarBrandCreationAttrs {
    brand: string;
}

@Table({ tableName: "brands" }) // Укажите имя таблицы в базе данных
export class CarBrand extends Model<CarBrand, CarBrandCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Unique
    @Column
    brand: string;

    @HasMany(() => Car)
    cars: Car[];

    @HasMany(() => CarBrandModel)
    models: CarBrandModel[];
}
