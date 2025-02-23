/** @format */

import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

interface User {
    userId: number;
    username: string;
    role: string; // Одна строка, а не массив
}

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            "roles",
            [context.getHandler(), context.getClass()]
        );

        if (!requiredRoles) {
            return true; // Если роли не указаны, доступ открыт
        }

        const request = context.switchToHttp().getRequest<Request>();
        const user = request["user"] as User; // Приводим `user` к нужному типу

        if (!user || !user.role) {
            throw new ForbiddenException("Доступ запрещен");
        }

        // Преобразуем строку роли в массив для удобства сравнения
        const userRoles = [user.role];

        // Проверяем, есть ли у пользователя хотя бы одна из требуемых ролей
        const hasRole = requiredRoles.some((role) => userRoles.includes(role));

        if (!hasRole) {
            throw new ForbiddenException("Недостаточно прав");
        }

        return true;
    }
}
