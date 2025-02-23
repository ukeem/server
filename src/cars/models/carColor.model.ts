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

interface CarColorCreationAttrs {
    color: string;
}

@Table({ tableName: "colors" }) // Укажите имя таблицы в базе данных
export class CarColor extends Model<CarColor, CarColorCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Unique
    @Column
    color: string;

    @HasMany(() => Car)
    cars: Car[];
}
