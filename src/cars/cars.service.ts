/** @format */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { FetchCarDto } from "./dto/fetch-car.dto";
import { ApiService } from "src/api/api.service";
import { IResponseData } from "./cars.interface";
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
import { Op, Sequelize, WhereOptions } from "sequelize";
import { FilterCarDto } from "./dto/filter-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import * as fs from "fs";
import * as path from "path";
import { Exchange } from "src/exchange/exchange.model";
import { MinYearCarsDto } from "./dto/min-year-cars.dto";
import { MaxYearCarsDto } from "./dto/max-year-cars.dto";
import { MinEngineCarsDto } from "./dto/min-engine.dto";
import { MaxEngineCarsDto } from "./dto/max-engine.dto";
import { MinMileageCarsDto } from "./dto/min-mileage.dto";
import { MaxMileageCarsDto } from "./dto/max-mileage.dto";
import { BodyCarsDto } from "./dto/body.dto";
import { TransmissionCarsDto } from "./dto/transmission.dto";

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

            console.log(`Добавлено машин: ${results.length}`);

            await this.deleteDublicate();
            const ex = await this.exchange.findOne({
                where: { courseId: 1 },
            });
            const course = parseFloat(Number(ex?.course).toFixed(4));
            console.log(ex?.course, typeof course, course);

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
                `${process.env.API_URL}${encarId}?include=CATEGORY,SPEC,PHOTOS,OPTIONS`
            );

            const [brand] = await this.carBrand.findOrCreate({
                where: { brand: response.category.manufacturerEnglishName },
            });

            const [model] = await this.carBrandModel.findOrCreate({
                where: {
                    model: response.category.modelGroupEnglishName,
                    brandId: brand.id,
                },
            });

            const [edition] = await this.carBrandModelEdition.findOrCreate({
                where: {
                    edition: response.category.gradeEnglishName,
                    modelId: model.id,
                },
            });

            const [fuel] = await this.carFuel.findOrCreate({
                where: { fuel: response.spec.fuelName },
            });

            const [color] = await this.carColor.findOrCreate({
                where: { color: response.spec.colorName },
            });

            const [engine] = await this.carEngine.findOrCreate({
                where: { engine: response.spec.displacement },
            });

            const [body] = await this.carBody.findOrCreate({
                where: { body: response.spec.bodyName },
            });

            const [transmission] = await this.carTransmission.findOrCreate({
                where: { transmission: response.spec.transmissionName },
            });

            const saveData: SaveCarDto = {
                encarId,
                mileage: (response.spec.mileage / 1000) * 1000,
                clazz: response.category.gradeDetailEnglishName,
                year: response.category.formYear,
                price: parseFloat(
                    (
                        ((response.category.originPrice * 10000) / 100000) *
                            100000 +
                        500000
                    ).toFixed(0)
                ),
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

            const savesPhotos = await this.savePhotos(saveData.photos);
            saveData.photos = savesPhotos;

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
            throw new HttpException(
                {
                    message: `Авто с ${existingEncarId.encarId} есть в БД`,
                    statusCode: HttpStatus.CONFLICT,
                },
                HttpStatus.CONFLICT
            );
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

                    const [createdOption] = await this.carOption.findOrCreate({
                        where: { option: optionName },
                    });

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
                limit,
                offset,
            } = filterDto;

            const where: any = {};

            if (minMileage || maxMileage) {
                where.mileage = {};
                if (minMileage) where.mileage[Op.gte] = minMileage;
                if (maxMileage) where.mileage[Op.lte] = maxMileage;
            }

            if (minYear != undefined || maxYear != undefined) {
                where.year = {};
                if (minYear != undefined) where.year[Op.gte] = minYear;
                if (maxYear != undefined) where.year[Op.lte] = maxYear;
            }

            if (minPrice != undefined || maxPrice != undefined) {
                where.price = {};
                if (minPrice != undefined) where.price[Op.gte] = minPrice;
                if (maxPrice != undefined) where.price[Op.lte] = maxPrice;
            }

            // Двигатель
            if (minEngine !== undefined || maxEngine !== undefined) {
                where.engineId = new Set(); // Используем Set для устранения дублей

                if (minEngine !== undefined) {
                    const minEngineCars = await this.carEngine.findAll({
                        where: { engine: { [Op.gte]: minEngine } },
                    });

                    minEngineCars.forEach((engine) =>
                        where.engineId.add(engine.id)
                    );
                }

                if (maxEngine !== undefined) {
                    const maxEngineCars = await this.carEngine.findAll({
                        where: { engine: { [Op.lte]: maxEngine } },
                    });

                    maxEngineCars.forEach((engine) =>
                        where.engineId.add(engine.id)
                    );
                }

                if (where.engineId.size > 0) {
                    where.engineId = { [Op.in]: Array.from(where.engineId) };
                } else {
                    delete where.engineId;
                }
            }

            // Бренд
            if (brandIds) {
                where.brandId = { [Op.in]: brandIds };
            }

            // Модель
            if (modelIds) {
                where.modelId = { [Op.in]: modelIds };
            }

            // Комплектация
            if (editionIds) {
                where.editionId = { [Op.in]: editionIds };
            }

            // Топливо
            if (fuelIds) {
                where.fuelId = { [Op.in]: fuelIds };
            }

            // Цвет
            if (colorIds) {
                where.colorId = { [Op.in]: colorIds };
            }

            // Кузов
            if (bodyIds) {
                where.bodyId = { [Op.in]: bodyIds };
            }

            // Коробка передач
            if (transmissionIds) {
                where.transmissionId = { [Op.in]: transmissionIds };
            }

            // Запрос в БД
            const cars = await this.carModel.findAll({
                where,
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
                        through: { attributes: [] },
                    }, // Убираем данные из таблицы связки many-to-many
                    { model: CarPhoto, attributes: ["id", "photo"] },
                ],
                limit: limit ? Number(limit) : undefined,
                offset: offset ? Number(offset) : undefined,
                order: [["createdAt", "DESC"]],
            });

            if (cars.length === 0) {
                throw new HttpException(
                    {
                        message: "Авто не найдены",
                        statusCode: HttpStatus.NOT_FOUND,
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            console.log("Найдено машин:", cars.length);
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

    // async getAllCars() {
    //     try {
    //         const cars = await this.carModel.findAll({
    //             attributes: [
    //                 "id",
    //                 "encarId",
    //                 "mileage",
    //                 "clazz",
    //                 "year",
    //                 "price",
    //                 "createdAt",
    //             ],
    //             include: [
    //                 { model: CarBrand, attributes: ["id", "brand"] },
    //                 { model: CarBrandModel, attributes: ["id", "model"] },
    //                 {
    //                     model: CarBrandModelEdition,
    //                     attributes: ["id", "edition"],
    //                 },
    //                 { model: CarFuel, attributes: ["id", "fuel"] },
    //                 { model: CarColor, attributes: ["id", "color"] },
    //                 { model: CarEngine, attributes: ["id", "engine"] },
    //                 { model: CarBody, attributes: ["id", "body"] },
    //                 {
    //                     model: CarTransmission,
    //                     attributes: ["id", "transmission"],
    //                 },
    //                 {
    //                     model: CarOption,
    //                     attributes: ["id", "option"],
    //                     through: { attributes: [] },
    //                 }, // Убираем данные из таблицы связки many-to-many
    //                 { model: CarPhoto, attributes: ["id", "photo"] },
    //             ],
    //             order: [["createdAt", "DESC"]],
    //         });

    //         const ex = await this.exchange.findOne({
    //             where: { courseId: 1 },
    //         });

    //         if (!ex?.course) {
    //             throw new HttpException(
    //                 {
    //                     message: "Курс валюты не найден в БД",
    //                     statusCode: HttpStatus.BAD_REQUEST,
    //                 },
    //                 HttpStatus.BAD_REQUEST
    //             );
    //         }

    //         const course = Number(ex?.course);

    //         if (cars.length === 0) {
    //             throw new HttpException(
    //                 {
    //                     message: "Авто не найдены",
    //                     statusCode: HttpStatus.NOT_FOUND,
    //                 },
    //                 HttpStatus.NOT_FOUND
    //             );
    //         }

    //         console.log("Найдено машин:", cars.length);
    //         return cars;
    //     } catch (error) {
    //         throw new HttpException(
    //             {
    //                 message: `Ошибка getAllCars: ${error.message}`,
    //                 statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    //             },
    //             HttpStatus.INTERNAL_SERVER_ERROR
    //         );
    //     }
    // }

    async getAllCars() {
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
                order: [["createdAt", "DESC"]],
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
                car.setDataValue("price", car.price * course);
            });

            return cars;
        } catch (error) {
            throw new HttpException(
                `Ошибка getAllCars: ${error.message}`,
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

            car.setDataValue("price", car.price * course);

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

        console.log("Дубликаты и их фото удалены");
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
}
