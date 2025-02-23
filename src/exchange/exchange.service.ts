/** @format */

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import axios from "axios";
import * as cheerio from "cheerio";
import { Exchange } from "./exchange.model";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class ExchangeService implements OnModuleInit {
    private readonly logger = new Logger(ExchangeService.name);

    constructor(
        @InjectModel(Exchange)
        private readonly exchangeModel: typeof Exchange
    ) {}

    async fetchExchangeRate(): Promise<number | null> {
        try {
            const url = "https://www.google.com/finance/quote/KRW-RUB";
            const { data } = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0", // Моделируем браузер
                },
            });

            const $ = cheerio.load(data);

            // Получаем значение атрибута data-last-price
            const rateText = $("div[data-last-price]").attr("data-last-price");
            if (!rateText) throw new Error("Не удалось найти курс");

            const rate = parseFloat(rateText);
            this.logger.log(`Текущий курс 1 KRW = ${rate} RUB`);
            return rate;
        } catch (error) {
            this.logger.error("Ошибка при парсинге курса:", error);
            return null;
        }
    }

    @Cron("0 0 * * *") // Запуск в 00:00 каждый день
    async updateExchangeRate() {
        this.logger.log("Запуск ежедневного обновления курса...");
        const value = await this.fetchExchangeRate();
        if (!value) return;

        const course = await this.exchangeModel.findOne({
            where: { courseId: 1 },
        });

        if (!course) {
            await this.exchangeModel.create({ courseId: 1, course: value });
        } else {
            await course.update({ course: value });
        }
        this.logger.log(`Курс ${value} RUB сохранён в БД.`);
    }

    async onModuleInit() {
        this.logger.log("Проверка курса в БД при запуске...");
        const course = await this.exchangeModel.findOne({
            where: { courseId: 1 },
        });
        if (!course) {
            this.logger.log("Курс отсутствует в БД, запускаем обновление...");
            await this.updateExchangeRate();
        } else {
            this.logger.log(`Курс уже есть в БД: ${course.course} RUB.`);
        }
    }
}
