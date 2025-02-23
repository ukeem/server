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
    BelongsTo,
    ForeignKey,
} from "sequelize-typescript";
import { Car } from "./car.model";

interface CarPhotoCreationAttrs {
    photo: string;
    carId: number;
}

@Table({ tableName: "photos" }) // Укажите имя таблицы в базе данных
export class CarPhoto extends Model<CarPhoto, CarPhotoCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Column
    photo: string;

    @ForeignKey(() => Car)
    @Column
    carId: number;

    @BelongsTo(() => Car)
    car: Car;
}
