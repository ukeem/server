/** @format */

import {
    Column,
    Model,
    Table,
    PrimaryKey,
    AutoIncrement,
    ForeignKey,
    Unique,
    BelongsTo,
    AllowNull,
    HasMany,
    Index,
    BelongsToMany,
} from "sequelize-typescript";
import { CarBrand } from "./carBrand.model";
import { CarFuel } from "./carFuel.model";
import { CarColor } from "./carColor.model";
import { CarEngine } from "./carEngine.model";
import { CarBody } from "./carBody.model";
import { CarTransmission } from "./carTransmission.model";
import { CarPhoto } from "./carPhoto.model";
import { CarBrandModel } from "./carBrandModel.model";
import { CarBrandModelEdition } from "./carBrandModelEdition.model";
import { CarOption } from "./carOption.model";
import { CarCarOption } from "./carCarOption.model";

interface CarCreationAttrs {
    encarId: string;
    mileage: number;
    clazz?: string;
    year: number;
    price: number;
    brandId: number;
    modelId: number;
    editionId: number;
    fuelId: number;
    colorId: number;
    engineId: number;
    bodyId: number;
    transmissionId: number;
}

@Table({ tableName: "cars" }) // Имя таблицы
export class Car extends Model<Car, CarCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Unique
    @Index
    @Column
    encarId: string;

    @AllowNull(false)
    @Column({ defaultValue: 0 })
    mileage: number;

    @Column
    clazz?: string;

    @AllowNull(false)
    @Column
    year: number;

    @AllowNull(false)
    @Column({ defaultValue: 0 })
    price: number;

    @ForeignKey(() => CarBrand)
    @Column
    brandId: number;

    @ForeignKey(() => CarBrandModel)
    @Column
    modelId: number;

    @ForeignKey(() => CarBrandModelEdition)
    @Column
    editionId: number;

    @ForeignKey(() => CarFuel)
    @Column
    fuelId: number;

    @ForeignKey(() => CarColor)
    @Column
    colorId: number;

    @ForeignKey(() => CarEngine)
    @Column
    engineId: number;

    @ForeignKey(() => CarBody)
    @Column
    bodyId: number;

    @ForeignKey(() => CarTransmission)
    @Column
    transmissionId: number;

    @BelongsTo(() => CarBrand, { onDelete: "CASCADE" })
    brand: CarBrand;

    @BelongsTo(() => CarBrandModel, { onDelete: "CASCADE" })
    model: CarBrandModel;

    @BelongsTo(() => CarBrandModelEdition, { onDelete: "CASCADE" })
    edition: CarBrandModelEdition;

    @BelongsTo(() => CarFuel, { onDelete: "CASCADE" })
    fuel: CarFuel;

    @BelongsTo(() => CarColor, { onDelete: "CASCADE" })
    color: CarColor;

    @BelongsTo(() => CarEngine, { onDelete: "CASCADE" })
    engine: CarEngine;

    @BelongsTo(() => CarBody, { onDelete: "CASCADE" })
    body: CarBody;

    @BelongsTo(() => CarTransmission, { onDelete: "CASCADE" })
    transmission: CarTransmission;

    @BelongsToMany(() => CarOption, () => CarCarOption)
    options: CarOption[];

    @HasMany(() => CarPhoto, { onDelete: "CASCADE" })
    photos: CarPhoto[];
}
