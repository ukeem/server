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

interface CarFuelCreationAttrs {
    fuel: string;
}

@Table({ tableName: "fuels" }) // Укажите имя таблицы в базе данных
export class CarFuel extends Model<CarFuel, CarFuelCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Unique
    @Column
    fuel: string;

    @HasMany(() => Car)
    cars: Car[];
}
