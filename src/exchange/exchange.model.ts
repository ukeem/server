/** @format */

import {
    Column,
    Model,
    Table,
    PrimaryKey,
    AutoIncrement,
} from "sequelize-typescript";

interface ExchangeCreationAttrs {
    course: number;
    courseId: number;
}

@Table({ tableName: "exchange" }) // Укажите имя таблицы в базе данных
export class Exchange extends Model<Exchange, ExchangeCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @Column({ type: "DECIMAL(10,8)", allowNull: false })
    course: number;

    @Column
    courseId: number;
}
