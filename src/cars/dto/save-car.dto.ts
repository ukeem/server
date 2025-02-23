/** @format */

export class SaveCarDto {
    readonly encarId: string;
    readonly mileage: number;
    readonly clazz: string;
    readonly year: number;
    readonly price: number;
    readonly brandId: number;
    readonly modelId: number;
    readonly editionId: number;
    readonly fuelId: number;
    readonly colorId: number;
    readonly engineId: number;
    readonly bodyId: number;
    readonly transmissionId: number;
    photos: string[];
    readonly options: string[];
}
