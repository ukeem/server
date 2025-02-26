/** @format */

export class FilterCarDto {
    minMileage?: number;
    maxMileage?: number;
    minYear?: number;
    maxYear?: number;
    minPrice?: number;
    maxPrice?: number;
    brandIds?: number[];
    modelIds?: number[];
    editionIds?: number[];
    fuelIds?: number[];
    colorIds?: number[];
    minEngine?: number;
    maxEngine?: number;
    bodyIds?: number[];
    transmissionIds?: number[];
    limit?: number;
    offset?: number;
    orderKey?: string;
    orderValue?: string;
}
