/** @format */

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import puppeteer from "puppeteer";
import { Exchange } from "./exchange.model";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class ExchangeService implements OnModuleInit {
    private readonly logger = new Logger(ExchangeService.name);

    constructor(
        @InjectModel(Exchange)
        private readonly exchangeModel: typeof Exchange
    ) {}

    async fetchExchangeRate() {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto("https://www.google.com/finance/quote/KRW-RUB", {
            waitUntil: "load",
        });

        const rate = await page.evaluate(() => {
            const el = document.querySelector("div[data-last-price]");
            return el ? el.getAttribute("data-last-price") : null;
        });

        await browser.close();
        return rate ? parseFloat(rate) : null;
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
