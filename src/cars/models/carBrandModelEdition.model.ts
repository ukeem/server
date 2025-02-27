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
    ForeignKey,
    HasMany,
} from "sequelize-typescript";
import { CarBrandModel } from "./carBrandModel.model";
import { Car } from "./car.model";

interface CarBrandModelEditionCreationAttrs {
    edition: string;
    modelId: number;
}

@Table({ tableName: "editions" }) // Укажите имя таблицы в базе данных
export class CarBrandModelEdition extends Model<
    CarBrandModelEdition,
    CarBrandModelEditionCreationAttrs
> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Column
    edition: string;

    @ForeignKey(() => CarBrandModel)
    @Column
    modelId: number;

    @BelongsTo(() => CarBrandModel)
    model: CarBrandModel;

    @HasMany(() => Car)
    cars: Car[];
}
