/** @format */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { FetchCarDto } from "./dto/fetch-car.dto";
import { ApiService } from "src/api/api.service";
import { IResponseData, MaxEncarIdResult } from "./cars.interface";
import { Car } from "./models/car.model";
import { CarBrand } from "./models/carBrand.model";
import { CarBrandModel } from "./models/carBrandModel.model";
import { CarBrandModelEdition } from "./models/carBrandModelEdition.model";
import { CarEngine } from "./models/carEngine.model";
import { CarTransmission } from "./models/carTransmission.model";
import { CarColor } from "./models/carColor.model";
import { CarBody } from "./models/carBody.model";
import { CarFuel } from "./models/carFuel.model";
import { CarPhoto } from "./models/carPhoto.model";
import { InjectModel } from "@nestjs/sequelize";
import { SaveCarDto } from "./dto/save-car.dto";
import { CarOption } from "./models/carOption.model";
import { CarCarOption } from "./models/carCarOption.model";
import { Op, Sequelize } from "sequelize";
import { FilterCarDto } from "./dto/filter-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import * as fs from "fs";
import * as path from "path";
import { Exchange } from "src/exchange/exchange.model";
import { BrandIdsDto } from "./dto/brand-dto";
import { BrandIdsAndModelIdsDto } from "./dto/edition-dto";

@Injectable()
export class CarsService {
    constructor(
        @InjectModel(Car)
        private readonly carModel: typeof Car,
        @InjectModel(CarBody)
        private readonly carBody: typeof CarBody,
        @InjectModel(CarBrand)
        private readonly carBrand: typeof CarBrand,
        @InjectModel(CarBrandModel)
        private readonly carBrandModel: typeof CarBrandModel,
        @InjectModel(CarBrandModelEdition)
        private readonly carBrandModelEdition: typeof CarBrandModelEdition,
        @InjectModel(CarColor)
        private readonly carColor: typeof CarColor,
        @InjectModel(CarEngine)
        private readonly carEngine: typeof CarEngine,
        @InjectModel(CarFuel)
        private readonly carFuel: typeof CarFuel,
        @InjectModel(CarPhoto)
        private readonly carPhoto: typeof CarPhoto,
        @InjectModel(CarTransmission)
        private readonly carTransmission: typeof CarTransmission,
        @InjectModel(CarOption)
        private readonly carOption: typeof CarOption,
        @InjectModel(Exchange)
        private readonly exchange: typeof Exchange,
        @InjectModel(CarCarOption)
        private readonly carCarOption: typeof CarCarOption,
        private readonly apiService: ApiService
    ) {}

    async fetchAllCars(fetchCarDto: FetchCarDto) {
        try {
            const { carIds } = fetchCarDto;

            if (carIds.length === 0) {
                return "Введите Encar ID";
            }
            const results = await Promise.allSettled(
                carIds.map((carId) => this.fetchCar(carId))
            );
            // const results = await Promise.all(
            //     carIds.map((carId) => this.fetchCar(carId))
            // );

            carIds.map(async (carId) => await this.fetchCar(carId));

            console.log(`Добавлено машин: ${results.length}`);

            await this.deleteDublicate();
            // const ex = await this.exchange.findOne({
            //     where: { courseId: 1 },
            // });
            // const course = parseFloat(Number(ex?.course).toFixed(4));
            // console.log(ex?.course, typeof course, course);

            const cars = await this.carModel.findAll();
            return cars;
            // return results.map((result) =>
            //     result.status === "fulfilled"
            //         ? result.value
            //         : { error: result.reason }
            // );
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка fetchAllCars`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private async fetchCar(encarId: string) {
        try {
            const response: IResponseData = await this.apiService.fetchData(
                `${process.env.API_URL}${encarId}?include=CATEGORY,ADVERTISEMENT,SPEC,PHOTOS,OPTIONS`
            );

            if (!response) {
                throw new HttpException(
                    {
                        message: `Ошибка при получении encarId ${encarId}`,
                        statusCode: HttpStatus.NOT_FOUND,
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            let brand = await this.carBrand.findOne({
                where: { brand: response.category.manufacturerEnglishName },
            });
            if (!brand) {
                brand = await this.carBrand.create({
                    brand: response.category.manufacturerEnglishName,
                });
            }

            let model = await this.carBrandModel.findOne({
                where: {
                    model: response.category.modelGroupEnglishName,
                    brandId: brand.id,
                },
            });
            if (!model) {
                model = await this.carBrandModel.create({
                    model: response.category.modelGroupEnglishName,
                    brandId: brand.id,
                });
            }

            let edition = await this.carBrandModelEdition.findOne({
                where: {
                    edition: response.category.gradeEnglishName,
                    modelId: model.id,
                },
            });
            if (!edition) {
                edition = await this.carBrandModelEdition.create({
                    edition: response.category.gradeEnglishName,
                    modelId: model.id,
                });
            }

            let fuel = await this.carFuel.findOne({
                where: { fuel: response.spec.fuelName },
            });
            if (!fuel) {
                fuel = await this.carFuel.create({
                    fuel: response.spec.fuelName,
                });
            }

            let color = await this.carColor.findOne({
                where: { color: response.spec.colorName },
            });
            if (!color) {
                color = await this.carColor.create({
                    color: response.spec.colorName,
                });
            }

            let engine = await this.carEngine.findOne({
                where: { engine: response.spec.displacement },
            });
            if (!engine) {
                engine = await this.carEngine.create({
                    engine: response.spec.displacement.toString(),
                });
            }

            let body = await this.carBody.findOne({
                where: { body: response.spec.bodyName },
            });
            if (!body) {
                body = await this.carBody.create({
                    body: response.spec.bodyName,
                });
            }

            let transmission = await this.carTransmission.findOne({
                where: { transmission: response.spec.transmissionName },
            });
            if (!transmission) {
                transmission = await this.carTransmission.create({
                    transmission: response.spec.transmissionName,
                });
            }

            const basePrice =
                response?.advertisement?.price ??
                response?.category?.originPrice;

            const saveData: SaveCarDto = {
                encarId,
                mileage: Math.round(response.spec.mileage),
                clazz: response.category.gradeDetailEnglishName,
                year: response.category.formYear,
                price: Math.round((basePrice * 10000) / 100000) * 100000,
                brandId: brand.id,
                modelId: model.id,
                editionId: edition.id,
                fuelId: fuel.id,
                colorId: color.id,
                engineId: engine.id,
                bodyId: body.id,
                transmissionId: transmission.id,
                photos: [
                    ...new Set(response.photos.map((photo) => photo.path)),
                ],
                options: [...response.options.standard],
            };

            if (!saveData.photos.length) {
                throw new HttpException(
                    {
                        message: `Ошибка при получении encarId ${encarId}: нет фото`,
                        statusCode: HttpStatus.NOT_FOUND,
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            saveData.photos = await this.savePhotos(saveData.photos);

            console.log(`Сохранен авто с encarId ${encarId}`);

            return await this.saveCar(saveData);
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка при получении encarId ${encarId}: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    details: error,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    // private async fetchCar(encarId: string) {
    //     try {
    //         const response: IResponseData = await this.apiService.fetchData(
    //             `${process.env.API_URL}${encarId}?include=CATEGORY,ADVERTISEMENT,SPEC,PHOTOS,OPTIONS`
    //         );

    //         const brand =
    //             (await this.carBrand.findOne({
    //                 where: { brand: response.category.manufacturerEnglishName },
    //             })) ||
    //             (await this.carBrand.create({
    //                 brand: response.category.manufacturerEnglishName,
    //             }));

    //         const model =
    //             (await this.carBrandModel.findOne({
    //                 where: {
    //                     model: response.category.modelGroupEnglishName,
    //                     brandId: brand.id,
    //                 },
    //             })) ||
    //             (await this.carBrandModel.create({
    //                 model: response.category.modelGroupEnglishName,
    //                 brandId: brand.id,
    //             }));

    //         const edition =
    //             (await this.carBrandModelEdition.findOne({
    //                 where: {
    //                     edition: response.category.gradeEnglishName,
    //                     modelId: model.id,
    //                 },
    //             })) ||
    //             (await this.carBrandModelEdition.create({
    //                 edition: response.category.gradeEnglishName,
    //                 modelId: model.id,
    //             }));

    //         const fuel =
    //             (await this.carFuel.findOne({
    //                 where: { fuel: response.spec.fuelName },
    //             })) ||
    //             (await this.carFuel.create({ fuel: response.spec.fuelName }));

    //         const color =
    //             (await this.carColor.findOne({
    //                 where: { color: response.spec.colorName },
    //             })) ||
    //             (await this.carColor.create({
    //                 color: response.spec.colorName,
    //             }));

    //         const engine =
    //             (await this.carEngine.findOne({
    //                 where: { engine: response.spec.displacement },
    //             })) ||
    //             (await this.carEngine.create({
    //                 engine: response.spec.displacement.toString(),
    //             }));

    //         const body =
    //             (await this.carBody.findOne({
    //                 where: { body: response.spec.bodyName },
    //             })) ||
    //             (await this.carBody.create({ body: response.spec.bodyName }));

    //         const transmission =
    //             (await this.carTransmission.findOne({
    //                 where: { transmission: response.spec.transmissionName },
    //             })) ||
    //             (await this.carTransmission.create({
    //                 transmission: response.spec.transmissionName,
    //             }));

    //         const basePrice =
    //             response?.category?.originPrice ??
    //             response?.advertisement?.price;

    //         const saveData: SaveCarDto = {
    //             encarId,
    //             mileage: (response.spec.mileage / 1000) * 1000,
    //             clazz: response.category.gradeDetailEnglishName,
    //             year: response.category.formYear,
    //             price:
    //                 Math.round((basePrice * 10000 + 500000) / 100000) * 100000,
    //             brandId: brand.id,
    //             modelId: model.id,
    //             editionId: edition.id,
    //             fuelId: fuel.id,
    //             colorId: color.id,
    //             engineId: engine.id,
    //             bodyId: body.id,
    //             transmissionId: transmission.id,
    //             photos: [
    //                 ...new Set(response.photos.map((photo) => photo.path)),
    //             ],
    //             options: [...response.options.standard],
    //         };

    //         // Сначала сохраняем авто, потом загружаем фото
    //         const savedCar = await this.saveCar(saveData);

    //         if (saveData.photos.length > 0) {
    //             saveData.photos = await this.savePhotos(saveData.photos);
    //         }

    //         return savedCar;
    //     } catch (error) {
    //         throw new HttpException(
    //             {
    //                 message: `Ошибка при получении encarId ${encarId}: ${error.message}`,
    //                 statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    //                 details: error,
    //             },
    //             HttpStatus.INTERNAL_SERVER_ERROR
    //         );
    //     }
    // }

    private async saveCar(saveCarDto: SaveCarDto) {
        const {
            encarId,
            mileage,
            clazz,
            year,
            price,
            brandId,
            modelId,
            editionId,
            fuelId,
            colorId,
            engineId,
            bodyId,
            transmissionId,
            photos,
            options,
        } = saveCarDto;

        const existingEncarId = await this.carModel.findOne({
            where: { encarId },
        });

        if (existingEncarId) {
            console.log(`Авто есть в БД ${existingEncarId.encarId}`);
            return; // просто выходим из функции, не вызывая ошибку
        }

        const existingCar = await this.carModel.findOne({
            where: {
                brandId,
                modelId,
                editionId,
                colorId,
                transmissionId,
                clazz,
            },
        });

        if (existingCar) {
            console.log(
                `Авто есть в БД ${existingCar.encarId} бренд, модель, комплектация, цвет, коробка`
            );
            return; // просто выходим из функции, не вызывая ошибку
        }

        try {
            const car = await this.carModel.create({
                encarId,
                mileage,
                clazz,
                year,
                price,
                brandId,
                modelId,
                editionId,
                fuelId,
                colorId,
                engineId,
                bodyId,
                transmissionId,
            });

            await Promise.all(
                photos.map(async (photo) => {
                    await this.carPhoto.create({
                        carId: car.id,
                        photo,
                    });
                })
            );

            const createdOptions = await Promise.all(
                options.map(async (option) => {
                    const optionName = getOptionName(option);

                    if (!optionName) return null; // Если опция неизвестна, пропускаем

                    let createdOption = await this.carOption.findOne({
                        where: { option: optionName },
                    });

                    if (!createdOption) {
                        createdOption = await this.carOption.create({
                            option: optionName,
                        });
                    }

                    return createdOption.id; // Возвращаем ID созданной опции
                })
            );

            await car.$set(
                "options",
                createdOptions.filter((id): id is number => id !== null)
            );

            function getOptionName(optionCode: string): string | null {
                const optionMap: Record<string, string> = {
                    "010": "Люк на крыше",
                    "075": "Фара светодиодная",
                    "029": "Фара ксеноновая",
                    "059": "Багажник с электроприводом",
                    "080": "Автодоводчик дверей",
                    "024": "Электроскладывающиеся боковые зеркала",
                    "017": "Алюминиевые диски",
                    "062": "Багажник на крыше",
                    "082": "Подогрев руля",
                    "083": "Электропривод рулевого колеса",
                    "084": "Переключение передач веслами",
                    "031": "Мультируль",
                    "030": "Электрохромное зеркало заднего вида",
                    "074": "Hi - Pass",
                    "006": "Центральный замок",
                    "008": "Электроусилитель руля",
                    "007": "Электростеклоподъёмники",
                    "027": "Водительская и пассажирская подушка безопасности",
                    "026": "Водительская подушка безопасности",
                    "020": "Боковая подушка безопасности",
                    "056": "Шторочная подушка безопасности",
                    "001": "Антиблокировочная система тормозов (ABS)",
                    "019": "Система противоскольжения (TCS)",
                    "055": "Система курсовой устойчивости (ESC)",
                    "033": "Датчик давления в шинах (TPMS)",
                    "088": "Система предупреждения о выходе из полосы (LDWS)",
                    "002": "Электронно управляемая подвеска (ECS)",
                    "032": "Парктроник (передний, задний)",
                    "085": "Парктроник (задний)",
                    "086": "Система предупреждения о боковом движении сзади",
                    "058": "Камера заднего вида",
                    "087": "Круговой обзор 360°",
                    "079": "Адаптивный круиз-контроль",
                    "068": "Обычный круиз-контроль",
                    "095": "Проекционный дисплей (HUD)",
                    "094": "Электронный стояночный тормоз (EPB)",
                    "023": "Автоматический кондиционер",
                    "057": "Смарт-ключ",
                    "015": "Беспроводной замок дверей",
                    "081": "Датчик дождя",
                    "097": "Автоматический свет",
                    "093": "Шторки (задние сиденья, заднее стекло)",
                    "092": "Шторки (заднее стекло)",
                    "005": "Навигация",
                    "004": "AV-монитор передних сидений",
                    "054": "AV-монитор задних сидений",
                    "096": "Bluetooth",
                    "003": "CD-плеер",
                    "072": "USB порт",
                    "071": "AUX порт",
                    "014": "Кожаные сиденья",
                    "021": "Электрорегулировка сидений (водительское)",
                    "035": "Электрорегулировка сидений (пассажирское)",
                    "089": "Электрорегулировка задних сидений",
                    "063": "Подогрев сидений (передние и задние)",
                    "078": "Память настроек сиденья (водительское)",
                    "051": "Память настроек сиденья (пассажирское)",
                    "077": "Вентилируемые сиденья (пассажирское)",
                    "034": "Вентилируемые сиденья (водительское)",
                    "090": "Вентилируемые сиденья (задние сиденья)",
                    "091": "Массажное сиденье",
                };

                return optionMap[optionCode] || null;
            }

            return await this.carModel.findOne({
                where: { id: car.id },
                include: [
                    { model: this.carBody },
                    { model: this.carBrand },
                    { model: this.carBrandModel },
                    { model: this.carBrandModelEdition },
                    { model: this.carColor },
                    { model: this.carEngine },
                    { model: this.carFuel },
                    { model: this.carTransmission },
                    {
                        model: this.carOption,
                        through: { attributes: [] }, // Убираем лишние атрибуты промежуточной таблицы
                    },
                    { model: this.carPhoto },
                ],
            });
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка при сохранении авто ${encarId}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    details: error,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async filterCars(filterDto: FilterCarDto) {
        // console.log(filterDto);

        try {
            const {
                minMileage,
                maxMileage,
                minYear,
                maxYear,
                minPrice,
                maxPrice,
                minEngine,
                maxEngine,
                brandIds,
                modelIds,
                editionIds,
                fuelIds,
                colorIds,
                bodyIds,
                transmissionIds,
                encarId,
                limit = 9999,
                offset = 0,
                orderKey = "createdAt",
                orderValue = "DESC",
            } = filterDto;

            const exchangeRate = await this.exchange.findOne({
                where: { courseId: 1 },
            });

            if (!exchangeRate?.course) {
                throw new HttpException(
                    "Курс валюты не найден в БД",
                    HttpStatus.BAD_REQUEST
                );
            }

            const course = Number(exchangeRate.course);

            const where: any = {};

            // Пробег
            if (minMileage !== undefined || maxMileage !== undefined) {
                where.mileage = {};
                if (minMileage !== undefined)
                    where.mileage[Op.gte] = minMileage;
                if (maxMileage !== undefined)
                    where.mileage[Op.lte] = maxMileage;
            }

            // Год выпуска
            if (minYear !== undefined || maxYear !== undefined) {
                where.year = {};
                if (minYear !== undefined) where.year[Op.gte] = minYear;
                if (maxYear !== undefined) where.year[Op.lte] = maxYear;
            }

            // Цена
            if (minPrice !== undefined || maxPrice !== undefined) {
                where.price = {};
                if (minPrice !== undefined)
                    where.price[Op.gte] = (minPrice - 500000) / course;
                if (maxPrice !== undefined)
                    where.price[Op.lte] = (maxPrice - 500000) / course;
            }

            // Двигатель (по ID)
            if (minEngine || maxEngine) {
                const engineWhere: any = {};
                if (minEngine) engineWhere[Op.gte] = minEngine;
                if (maxEngine) engineWhere[Op.lte] = maxEngine;

                const engineIds = await this.carEngine.findAll({
                    attributes: ["id"],
                    where: { engine: engineWhere },
                });

                const engineIdList = engineIds.map((e) => e.id);
                if (engineIdList.length > 0) {
                    where.engineId = { [Op.in]: engineIdList };
                }
            }

            // Фильтрация по массивам
            if (brandIds && brandIds.length > 0)
                where.brandId = { [Op.in]: brandIds };
            if (modelIds && modelIds.length > 0)
                where.modelId = { [Op.in]: modelIds };
            if (editionIds && editionIds.length > 0)
                where.editionId = { [Op.in]: editionIds };
            if (fuelIds && fuelIds.length > 0)
                where.fuelId = { [Op.in]: fuelIds };
            if (colorIds && colorIds.length > 0)
                where.colorId = { [Op.in]: colorIds };
            if (bodyIds && bodyIds.length > 0)
                where.bodyId = { [Op.in]: bodyIds };
            if (transmissionIds && transmissionIds.length > 0)
                where.transmissionId = { [Op.in]: transmissionIds };

            // encarId
            if (encarId) {
                where.encarId = encarId;
            }

            const cars = await this.carModel.findAll({
                attributes: [
                    "id",
                    "encarId",
                    "mileage",
                    "clazz",
                    "year",
                    "price",
                    "createdAt",
                ],
                include: [
                    { model: CarBrand, attributes: ["id", "brand"] },
                    { model: CarBrandModel, attributes: ["id", "model"] },
                    {
                        model: CarBrandModelEdition,
                        attributes: ["id", "edition"],
                    },
                    { model: CarFuel, attributes: ["id", "fuel"] },
                    { model: CarColor, attributes: ["id", "color"] },
                    { model: CarEngine, attributes: ["id", "engine"] },
                    { model: CarBody, attributes: ["id", "body"] },
                    {
                        model: CarTransmission,
                        attributes: ["id", "transmission"],
                    },
                    {
                        model: CarOption,
                        attributes: ["id", "option"],
                        through: { attributes: [] }, // Убираем данные из таблицы связки many-to-many
                    },
                    { model: CarPhoto, attributes: ["id", "photo"] },
                ],
                where,
                order: [[orderKey, orderValue]],
                limit: limit,
                offset: offset,
            });

            console.log("Найдено авто:", cars.length);

            cars.forEach((car) => {
                car.setDataValue(
                    "price",
                    Math.round((car.price * course + 500000) / 100000) * 100000
                );
            });
            // console.log(cars);

            return cars;
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка filterCars: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async filterCountCars(filterDto: FilterCarDto) {
        try {
            const {
                minMileage,
                maxMileage,
                minYear,
                maxYear,
                minPrice,
                maxPrice,
                minEngine,
                maxEngine,
                brandIds = [],
                modelIds = [],
                editionIds = [],
                fuelIds = [],
                colorIds = [],
                bodyIds = [],
                transmissionIds = [],
            } = filterDto;

            const exchangeRate = await this.exchange.findOne({
                where: { courseId: 1 },
            });

            if (!exchangeRate?.course) {
                throw new HttpException(
                    "Курс валюты не найден в БД",
                    HttpStatus.BAD_REQUEST
                );
            }

            const course = Number(exchangeRate.course);

            const where: any = {};

            // Пробег
            if (minMileage !== undefined || maxMileage !== undefined) {
                where.mileage = {};
                if (minMileage !== undefined)
                    where.mileage[Op.gte] = minMileage;
                if (maxMileage !== undefined)
                    where.mileage[Op.lte] = maxMileage;
            }

            // Год выпуска
            if (minYear !== undefined || maxYear !== undefined) {
                where.year = {};
                if (minYear !== undefined) where.year[Op.gte] = minYear;
                if (maxYear !== undefined) where.year[Op.lte] = maxYear;
            }

            // Цена
            if (minPrice !== undefined || maxPrice !== undefined) {
                where.price = {};
                if (minPrice !== undefined)
                    where.price[Op.gte] = Math.round(
                        (minPrice - 500000) / course
                    );
                if (maxPrice !== undefined)
                    where.price[Op.lte] = Math.round(
                        (maxPrice - 500000) / course
                    );
            }

            // Двигатель (по ID)
            if (minEngine || maxEngine) {
                const engineWhere: any = {};
                if (minEngine) engineWhere[Op.gte] = minEngine;
                if (maxEngine) engineWhere[Op.lte] = maxEngine;

                const engineIds = await this.carEngine.findAll({
                    attributes: ["id"],
                    where: { engine: engineWhere },
                });

                const engineIdList = engineIds.map((e) => e.id);
                if (engineIdList.length > 0) {
                    where.engineId = { [Op.in]: engineIdList };
                }
            }

            // Фильтрация по массивам
            if (brandIds.length > 0) where.brandId = { [Op.in]: brandIds };
            if (modelIds.length > 0) where.modelId = { [Op.in]: modelIds };
            if (editionIds.length > 0)
                where.editionId = { [Op.in]: editionIds };
            if (fuelIds.length > 0) where.fuelId = { [Op.in]: fuelIds };
            if (colorIds.length > 0) where.colorId = { [Op.in]: colorIds };
            if (bodyIds.length > 0) where.bodyId = { [Op.in]: bodyIds };
            if (transmissionIds.length > 0)
                where.transmissionId = { [Op.in]: transmissionIds };

            // Подсчет машин по фильтру
            const countCar = await this.carModel.count({ where });
            // console.log(` Найдено ${countCar} по фильтру`);

            return countCar;
        } catch (error) {
            // console.error("Ошибка filterCountCars:", error);
            throw new HttpException(
                {
                    message: `Ошибка filterCountCars: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getAllCars(orderKey = "createdAt", orderValue = "DESC") {
        try {
            const cars = await this.carModel.findAll({
                attributes: [
                    "id",
                    "encarId",
                    "mileage",
                    "clazz",
                    "year",
                    "price",
                    "createdAt",
                ],
                include: [
                    { model: CarBrand, attributes: ["id", "brand"] },
                    { model: CarBrandModel, attributes: ["id", "model"] },
                    {
                        model: CarBrandModelEdition,
                        attributes: ["id", "edition"],
                    },
                    { model: CarFuel, attributes: ["id", "fuel"] },
                    { model: CarColor, attributes: ["id", "color"] },
                    { model: CarEngine, attributes: ["id", "engine"] },
                    { model: CarBody, attributes: ["id", "body"] },
                    {
                        model: CarTransmission,
                        attributes: ["id", "transmission"],
                    },
                    {
                        model: CarOption,
                        attributes: ["id", "option"],
                        through: { attributes: [] }, // Убираем данные из таблицы связки many-to-many
                    },
                    { model: CarPhoto, attributes: ["id", "photo"] },
                ],
                order: [[orderKey, orderValue]],
            });

            if (cars.length === 0) {
                // throw new HttpException("Авто не найдены", HttpStatus.ACCEPTED);
                return [];
            }

            console.log("Найдено машин:", cars.length);

            const exchangeRate = await this.exchange.findOne({
                where: { courseId: 1 },
            });

            if (!exchangeRate?.course) {
                throw new HttpException(
                    "Курс валюты не найден в БД",
                    HttpStatus.BAD_REQUEST
                );
            }

            const course = Number(exchangeRate.course);

            // Преобразуем цены и возвращаем обновленный список машин
            cars.forEach((car) => {
                car.setDataValue(
                    "price",
                    Math.round((car.price * course + 500000) / 100000) * 100000
                );
            });

            return cars;
        } catch (error) {
            throw new HttpException(
                `Ошибка getAllCars: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getAllCarsForFilter() {
        try {
            const cars = await this.carModel.findAll({
                attributes: [
                    "id",
                    "mileage",
                    "clazz",
                    "year",
                    "price",
                    "encarId",
                    "createdAt",
                ],
                include: [
                    { model: CarBrand, attributes: ["id", "brand"] },
                    { model: CarBrandModel, attributes: ["id", "model"] },
                    {
                        model: CarBrandModelEdition,
                        attributes: ["id", "edition"],
                    },
                    { model: CarFuel, attributes: ["id", "fuel"] },
                    { model: CarColor, attributes: ["id", "color"] },
                    { model: CarEngine, attributes: ["id", "engine"] },
                    { model: CarBody, attributes: ["id", "body"] },
                    {
                        model: CarTransmission,
                        attributes: ["id", "transmission"],
                    },
                    {
                        model: CarOption,
                        attributes: ["id", "option"],
                        through: { attributes: [] }, // Убираем данные из таблицы связки many-to-many
                    },
                    { model: CarPhoto, attributes: ["id", "photo"] },
                ],
            });

            if (cars.length === 0) {
                // throw new HttpException("Авто не найдены", HttpStatus.ACCEPTED);
                return [];
            }

            console.log("Найдено машин:", cars.length);

            const exchangeRate = await this.exchange.findOne({
                where: { courseId: 1 },
            });

            if (!exchangeRate?.course) {
                throw new HttpException(
                    "Курс валюты не найден в БД",
                    HttpStatus.BAD_REQUEST
                );
            }

            const course = Number(exchangeRate.course);

            // Преобразуем цены и возвращаем обновленный список машин
            cars.forEach((car) => {
                car.setDataValue(
                    "price",
                    Math.round((car.price * course + 500000) / 100000) * 100000
                );
            });

            return cars;
        } catch (error) {
            throw new HttpException(
                `Ошибка getAllCarsForFilter: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getCar(id: number) {
        console.log(id);

        try {
            const car = await this.carModel.findByPk(id, {
                include: { all: true }, // Сразу загружаем все связи
            });

            if (!car) {
                throw new HttpException(
                    {
                        message: "Авто не найдено",
                        statusCode: HttpStatus.NOT_FOUND,
                    },
                    HttpStatus.NOT_FOUND
                );
            }
            const exchangeRate = await this.exchange.findOne({
                where: { courseId: 1 },
            });

            if (!exchangeRate?.course) {
                throw new HttpException(
                    "Курс валюты не найден в БД",
                    HttpStatus.BAD_REQUEST
                );
            }

            const course = Number(exchangeRate.course);

            car.setDataValue(
                "price",
                Math.round((car.price * course + 500000) / 100000) * 100000
            );

            return car;
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка getCar: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteCar(id: number) {
        try {
            const car = await this.carModel.findByPk(id);

            if (!car) {
                throw new HttpException(
                    {
                        message: "Авто не найдено",
                        statusCode: HttpStatus.NOT_FOUND,
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            const photos = await this.carPhoto.findAll({
                where: { carId: car.id },
            });
            for (const photo of photos) {
                const filePath = path.join(__dirname, "..", "..", photo.photo);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                await photo.destroy();
            }

            await car.destroy(); // Дожидаемся удаления

            return {
                message: `Авто с ID ${id} успешно удален`,
            };
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка deleteCar: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateCar(id: number, updateCarDto: UpdateCarDto) {
        try {
            const car = await this.carModel.findByPk(id);

            if (!car) {
                throw new HttpException(
                    {
                        message: "Авто не найдено",
                        statusCode: HttpStatus.NOT_FOUND,
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            await car.update(updateCarDto);

            return `Авто с ID ${id} успешно обновлен`;
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка updateCar: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteAllCars() {
        try {
            const uploadDir = path.join(__dirname, "..", "..", "uploads");

            // Проверяем, существует ли папка
            if (fs.existsSync(uploadDir)) {
                // Читаем все файлы в папке
                const files = fs.readdirSync(uploadDir);

                // Удаляем каждый файл
                for (const file of files) {
                    const filePath = path.join(uploadDir, file);
                    fs.unlinkSync(filePath);
                }
            }

            // Удаляем все записи из базы
            await this.carPhoto.destroy({ where: {} });
            await this.carModel.destroy({ where: {} });

            return { message: "Все авто и фото успешно удалены" };
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка deleteAllCars: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getCountCars() {
        return await this.carModel.count();
    }

    async getBrands() {
        const brands = await this.carBrand.findAll({
            attributes: ["id", "brand"],
        });

        if (!brands.length) {
            throw new HttpException(
                {
                    message: "Производители не найдены",
                    statusCode: HttpStatus.NOT_FOUND,
                },
                HttpStatus.NOT_FOUND
            );
        }

        return brands;
    }

    async getModelsByBrandIds(dto: BrandIdsDto) {
        const { brandIds } = dto;
        // ✅ Проверяем, что brandIds - массив и не пустой
        if (!Array.isArray(brandIds) || brandIds.length === 0) {
            throw new HttpException(
                {
                    message:
                        "brandIds должен быть массивом с хотя бы одним значением",
                    statusCode: HttpStatus.BAD_REQUEST,
                },
                HttpStatus.BAD_REQUEST
            );
        }

        const models = await this.carBrand.findAll({
            attributes: ["brand"],
            include: [{ model: CarBrandModel, attributes: ["id", "model"] }],
            where: {
                id: { [Op.in]: brandIds },
            },
        });

        if (models.length === 0) {
            throw new HttpException(
                {
                    message: "Модели не найдены",
                    statusCode: HttpStatus.NOT_FOUND,
                },
                HttpStatus.NOT_FOUND
            );
        }

        return models;
    }

    async getEditionsByModelIds(dto: BrandIdsAndModelIdsDto) {
        const { brandIds, modelIds } = dto;

        // 1. Получаем бренды и их модели
        const brandsAndModels = await this.carBrand.findAll({
            attributes: ["id", "brand"],
            include: [
                {
                    model: CarBrandModel,
                    as: "models",
                    attributes: ["id", "model"],
                },
            ],
            where: { id: { [Op.in]: brandIds } },
        });

        // 2. Получаем модели и их поколения
        const modelsAndEditions = await this.carBrandModel.findAll({
            attributes: ["id", "model"],
            include: [
                {
                    model: CarBrandModelEdition,
                    as: "editions",
                    attributes: ["id", "edition"],
                },
            ],
            where: { id: { [Op.in]: modelIds } },
        });

        // 3. Формируем результат
        const result = brandsAndModels
            .map(({ models }) =>
                models.map(({ id, model }) => {
                    const foundModel = modelsAndEditions.find(
                        (m) => m.id === id
                    );
                    return {
                        model, // Название модели
                        editions:
                            foundModel?.editions?.map(({ id, edition }) => ({
                                id,
                                edition,
                            })) || [], // Если нет editions, подставляем пустой массив
                    };
                })
            )
            .flat(); // Объединяем вложенные массивы

        return result;
    }

    async getMinMaxYear() {
        const minYear = await this.carModel.min("year");
        const maxYear = await this.carModel.max("year");
        if (!minYear || !maxYear) {
            throw new HttpException(
                {
                    message: "Года не найдены",
                    statusCode: HttpStatus.NOT_FOUND,
                },
                HttpStatus.NOT_FOUND
            );
        }
        return { minYear, maxYear };
    }

    async getMinMaxEngine() {
        // const minEngine = await this.carEngine.min("engine");
        const maxEngine = await this.carEngine.max("engine");

        return { maxEngine };
    }

    async getMinMaxMileage() {
        // const minEngine = await this.carEngine.min("engine");
        const maxMileage = await this.carModel.max("mileage");

        return { maxMileage };
    }

    async getMinMaxPrice() {
        const minPrice = await this.carModel.min("price");
        const maxPrice = await this.carModel.max("price");
        if (!minPrice || !maxPrice) {
            throw new HttpException(
                {
                    message: "Года не найдены",
                    statusCode: HttpStatus.NOT_FOUND,
                },
                HttpStatus.NOT_FOUND
            );
        }

        const exchangeRate = await this.exchange.findOne({
            where: { courseId: 1 },
        });

        if (!exchangeRate?.course) {
            throw new HttpException(
                "Курс валюты не найден в БД",
                HttpStatus.BAD_REQUEST
            );
        }

        const course = Number(exchangeRate.course);

        return {
            minPrice: Math.round(+minPrice * course),
            maxPrice: Math.round(+maxPrice * course),
        };
    }

    async getTransmissions() {
        const transmissions = await this.carTransmission.findAll({
            attributes: [
                [
                    Sequelize.fn("DISTINCT", Sequelize.col("transmission")),
                    "transmission",
                ],
            ],
        });

        return transmissions.map((t) => t.transmission); // Возвращаем массив уникальных значений
    }

    async getFuel() {
        const fuels = await this.carFuel.findAll({
            attributes: ["id", "fuel"], // Запрашиваем и id, и fuel
            // group: ["id", "fuel"], // Группируем по id и fuel
            // order: [["fuel", "ASC"]], // Можно сортировать по названию топлива
        });

        return fuels; // Возвращаем массив объектов
    }

    async getColor() {
        const colors = await this.carColor.findAll({
            attributes: ["id", "color"],
        });

        return colors; // Возвращаем массив уникальных значений
    }

    async getBodies() {
        const bodies = await this.carBody.findAll({
            attributes: ["id", "body"],
        });

        return bodies; // Возвращаем массив уникальных значений
    }

    async getOptions() {
        const options = await this.carOption.findAll({
            attributes: ["id", "option"],
        });

        return options; // Возвращаем массив уникальных значений
    }

    async deleteDublicate() {
        const duplicates = await this.carModel.findAll({
            attributes: [
                "brandId",
                "modelId",
                "editionId",
                "colorId",
                "transmissionId",
                "clazz",
                [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            group: [
                "brandId",
                "modelId",
                "editionId",
                "colorId",
                "transmissionId",
                "clazz",
            ],
            having: Sequelize.literal("COUNT(id) > 1"),
        });

        for (const dup of duplicates) {
            const {
                brandId,
                modelId,
                editionId,
                colorId,
                clazz,
                transmissionId,
            } = dup.get();

            const carsToDelete = await this.carModel.findAll({
                where: {
                    brandId,
                    modelId,
                    editionId,
                    colorId,
                    clazz,
                    transmissionId,
                },
                include: [{ model: CarPhoto }], // Загружаем фото перед удалением
                order: [["id", "ASC"]],
            });

            // Оставляем первый автомобиль, удаляем остальные
            carsToDelete.shift();
            for (const car of carsToDelete) {
                // Удаляем все фото машины перед удалением самой машины
                await CarPhoto.destroy({ where: { carId: car.id } });

                // Удаляем машину
                await car.destroy();
            }
        }

        console.log(`Удалено ${duplicates.length} дубликатов`);
    }

    private async savePhotos(photos: string[]) {
        const uploadDir = path.join(__dirname, "..", "..", "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const sortedPhotos = photos.sort();
        const savedFiles: string[] = [];

        for (const photo of sortedPhotos) {
            const url = `https://ci.encar.com/carpicture${photo}?impolicy=heightRate&rh=696&cw=1160&ch=696&cg=Center&wtmk=https://ci.encar.com/wt_mark/w_mark_04.png`;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(
                        `Ошибка загрузки ${photo}: ${response.statusText}`
                    );
                }

                const buffer = await response.arrayBuffer();
                const contentType =
                    response.headers.get("content-type") || "image/webp";

                // Определяем расширение файла
                let ext = ".webp"; // По умолчанию
                if (contentType.includes("jpeg")) ext = ".jpg";
                else if (contentType.includes("png")) ext = ".png";
                else if (contentType.includes("webp")) ext = ".webp";

                const fileName = path.basename(photo);
                const filePath = path.join(uploadDir, fileName);

                fs.writeFileSync(filePath, Buffer.from(buffer)); // Сохраняем файл

                savedFiles.push(`/uploads/${fileName}`);
            } catch (error) {
                console.error(`Ошибка загрузки ${photo}:`, error.message);
            }
        }

        return savedFiles;
    }

    private async findMaxEncarId(): Promise<string> {
        let encarId = await this.carModel.findOne({
            attributes: ["encarId"],
            order: [["encarId", "DESC"]],
            raw: true,
        });

        while (encarId && String(encarId.encarId).length < 8) {
            encarId = await this.carModel.findOne({
                attributes: ["encarId"],
                order: [["encarId", "DESC"]],
                where: { encarId: { [Op.lt]: encarId.encarId } }, // Берем следующий меньший
                raw: true,
            });
        }

        if (!encarId || !encarId.encarId) {
            return "Максимальный encarId не найден";
        }

        return String(encarId.encarId);
    }

    private async findEncarIds(maxEncarId: number): Promise<FetchCarDto> {
        let encarId = maxEncarId;
        const encarIds: string[] = [];
        let errorCount = 0;

        while (errorCount < 100) {
            encarId++;

            try {
                const response = await this.apiService.fetchData(
                    `${process.env.API_URL}${encarId}?include=CATEGORY,ADVERTISEMENT,SPEC,PHOTOS,OPTIONS`
                );

                const formYear = response?.category?.formYear;
                const diagnosisCar = response?.advertisement?.diagnosisCar;

                if (formYear && formYear >= 2020 && diagnosisCar === true) {
                    await this.fetchCar(encarId.toString());
                    encarIds.push(encarId.toString());
                }

                errorCount = 0; // Сбрасываем счетчик ошибок после успешного запроса
            } catch (error) {
                errorCount++;
                console.error(
                    `Ошибка запроса encarId=${encarId}: ${error.message}`
                );
                // await this.delay(100);
            }
        }

        return { carIds: encarIds };
    }

    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async findNewCars() {
        const maxEncarId = await this.findMaxEncarId();
        const encarIds: FetchCarDto = await this.findEncarIds(
            Number(maxEncarId)
        );

        console.log(` Найдено ${encarIds.carIds.length} новых машин`);

        return { message: `Найдено ${encarIds.carIds.length} новых машин` };
    }

    async deleteEmptyPhotos() {
        const photos = await this.carPhoto.findAll();

        for (const photo of photos) {
            if (!photo.photo) {
                await photo.destroy();
            }
        }
    }

    async deleteEmptyOptions() {
        const options = await this.carOption.findAll();

        for (const option of options) {
            if (!option.option) {
                await option.destroy();
            }
        }
    }

    onModuleInit() {
        this.deleteEmptyPhotos();
        this.deleteEmptyOptions();
    }
}
