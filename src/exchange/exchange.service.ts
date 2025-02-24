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
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.goto("https://finance.rambler.ru/currencies/KRW/", {
            waitUntil: "load",
        });
        await page.waitForSelector("span._ZXx92_y.CVUkSwiH");
        const rate = await page.evaluate(() => {
            const el = document.querySelector("span._ZXx92_y.CVUkSwiH");
            return el ? el.textContent?.trim() : null;
        });

        await browser.close();
        return rate ? parseFloat(rate) / 1000 : null;
    }

    @Cron("0 0 * * *")
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
        this.logger.log("Обновление курса в БД при запуске...");
        const course = await this.exchangeModel.findOne({
            where: { courseId: 1 },
        });

        const newCourse = await this.fetchExchangeRate();

        if (newCourse && course) {
            await course.update({ course: newCourse });
            this.logger.log("Курс обновлен успешно!");
        } else {
            this.logger.log("Ошибка обновления курса!");
        }
    }
}
