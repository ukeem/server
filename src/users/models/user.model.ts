/** @format */

import {
    Column,
    Model,
    Table,
    PrimaryKey,
    AutoIncrement,
    Unique,
    AllowNull,
    DataType,
} from "sequelize-typescript";

interface UserCreationAttrs {
    phone: string;
    password: string;
    role?: string;
}

@Table({ tableName: "users" }) // Укажите имя таблицы в базе данных
export class User extends Model<User, UserCreationAttrs> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @Unique
    @Column
    phone: string;

    @Column
    password: string;

    @Column({ defaultValue: "USER" })
    role?: string;

    @Column
    name?: string;

    @Column
    avatar?: string;
}
