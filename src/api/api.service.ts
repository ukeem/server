/** @format */

import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
// import fetch from "node-fetch";

@Injectable()
export class ApiService {
    async fetchData(
        url: string,
        method: string = "GET",
        headers?: Record<string, string>
    ): Promise<any> {
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...headers, // Можно передать дополнительные заголовки
                },
            });

            // Проверка на успешный ответ
            if (!response.ok) {
                throw new HttpException(
                    "Ошибка BAD_GATEWAY при получении данных из API",
                    HttpStatus.BAD_GATEWAY
                );
            }

            const data = await response.json();

            return data;
        } catch (error) {
            throw new HttpException(
                error.message ||
                    "Ошибка INTERNAL_SERVER_ERROR при получении данных из API",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
