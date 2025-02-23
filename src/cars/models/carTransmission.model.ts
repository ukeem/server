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

interface CarTransmissionCreationAttrs {
    transmission: string;
}

@Table({ tableName: "transmissions" }) // Укажите имя таблицы в базе данных
export class CarTransmission extends Model<
    CarTransmission,
    CarTransmissionCreationAttrs
> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Unique
    @Column
    transmission: string;

    @HasMany(() => Car)
    cars: Car[];
}
