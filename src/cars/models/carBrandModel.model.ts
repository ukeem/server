/** @format */

import {
    Column,
    Model,
    Table,
    PrimaryKey,
    AutoIncrement,
    Unique,
    BelongsTo,
    AllowNull,
    HasMany,
    ForeignKey,
} from "sequelize-typescript";
import { CarBrand } from "./carBrand.model";
import { CarBrandModelEdition } from "./carBrandModelEdition.model";
import { Car } from "./car.model";

interface CarBrandModelCreationAttrs {
    model: string;
    brandId: number;
}

@Table({ tableName: "models" }) // Укажите имя таблицы в базе данных
export class CarBrandModel extends Model<
    CarBrandModel,
    CarBrandModelCreationAttrs
> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Column
    model: string;

    @ForeignKey(() => CarBrand)
    @Column
    brandId: number;

    @BelongsTo(() => CarBrand)
    brand: CarBrand;

    @HasMany(() => Car)
    cars: Car[];

    @HasMany(() => CarBrandModelEdition)
    editions: CarBrandModelEdition[];
}
