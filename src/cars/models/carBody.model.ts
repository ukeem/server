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

interface CarBodyCreationAttrs {
    body: string;
}

@Table({ tableName: "bodies" }) // Укажите имя таблицы в базе данных
export class CarBody extends Model<CarBody, CarBodyCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Unique
    @Column
    body: string;

    @HasMany(() => Car)
    cars: Car[];
}
