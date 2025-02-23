/** @format */

import {
    AutoIncrement,
    Column,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from "sequelize-typescript";
import { Car } from "./car.model";
import { CarOption } from "./carOption.model";

@Table({ tableName: "carOptions" }) // Название таблицы
export class CarCarOption extends Model<CarCarOption> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @ForeignKey(() => Car)
    @Column
    carId: number;

    @ForeignKey(() => CarOption)
    @Column
    optionId: number;
}
