/** @format */

import { Optional } from "sequelize";
import { Car } from "./models/car.model";
import { NullishPropertiesOf } from "sequelize/types/utils";

interface IResponsePhoto {
    path: string;
    type: string;
}

export interface IResponseData {
    category: {
        manufacturerEnglishName: string;
        modelGroupEnglishName: string;
        gradeEnglishName: string;
        gradeDetailEnglishName: string;
        formYear: number;
        originPrice: number;
    };
    advertisement: {
        price: number;
    };
    spec: {
        mileage: number;
        displacement: number;
        transmissionName: string;
        colorName: string;
        bodyName: string;
        fuelName: string;
    };
    photos: IResponsePhoto[];
    options: {
        standard: string[];
    };
}

interface IPhoto {
    path: string;
}

export interface ICarData {
    encarId: string;
    brand: string;
    model: string;
    edition: string;
    clazz: string;
    year: number;
    price: number;
    mileage: number;
    engine: number;
    transmission: string;
    color: string;
    body: string;
    fuel: string;
    photos: IPhoto[];
}

export interface CarCreationAttributes
    extends Optional<Car, NullishPropertiesOf<Car>> {}
