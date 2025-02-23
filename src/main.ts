/** @format */

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as express from "express";
import * as path from "path";
import * as cors from "cors";

const PORT = process.env.PORT;

async function start() {
    const app = await NestFactory.create(AppModule);
    app.use(cors());

    app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
    await app.listen(PORT ?? 80, () => {
        console.log(`Server starting on ${PORT}`);
    });
}
start();
