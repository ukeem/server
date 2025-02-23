/** @format */

import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class FetchCarDto {
    @IsArray() // Указывает, что это массив
    @ArrayNotEmpty() // Проверяет, что массив не пустой
    @IsString({ each: true }) // Указывает, что каждый элемент массива должен быть строкой
    carIds: string[]; // Массив строк для хранения параметров автомобиля
}
