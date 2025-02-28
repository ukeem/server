/** @format */

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as express from "express";
import * as path from "path";
import * as cors from "cors";
import { Sequelize } from "sequelize-typescript";

const PORT = process.env.PORT;

async function start() {
    const app = await NestFactory.create(AppModule);

    // const sequelize = app.get(Sequelize);
    // await sequelize.sync({ alter: true });

    const server = app.getHttpServer();
    server.setTimeout(3000000);

    app.use(cors());

    app.use("/data", express.static(path.join(__dirname, "..", "data")));
    app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

    await app.listen(PORT ?? 5000, () => {
        console.log(`Server starting on ${PORT}`);
    });
}
start();
