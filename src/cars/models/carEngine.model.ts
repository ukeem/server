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

interface CarEngineCreationAttrs {
    engine: string;
}

@Table({ tableName: "engines" }) // Укажите имя таблицы в базе данных
export class CarEngine extends Model<CarEngine, CarEngineCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Unique
    @Column
    engine: number;

    @HasMany(() => Car)
    cars: Car[];
}
