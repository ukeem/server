/** @format */

import {
    Column,
    Model,
    Table,
    PrimaryKey,
    AutoIncrement,
    Unique,
    AllowNull,
    BelongsToMany,
} from "sequelize-typescript";
import { CarCarOption } from "./carCarOption.model";
import { Car } from "./car.model";

interface CarOptionCreationAttrs {
    option: string;
}

@Table({ tableName: "options" }) // Укажите имя таблицы в базе данных
export class CarOption extends Model<CarOption, CarOptionCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Unique
    @Column
    option: string;

    @BelongsToMany(() => Car, () => CarCarOption)
    options: Car[];
}
