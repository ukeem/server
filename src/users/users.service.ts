/** @format */

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./models/user.model";
import { InjectModel } from "@nestjs/sequelize";
import * as bcrypt from "bcryptjs";
import { UserRole } from "./users.interface";
import { JwtService } from "@nestjs/jwt";
import { LoginUserDto } from "./dto/login-user.dto";

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
        private jwtService: JwtService
    ) {}

    async onModuleInit() {
        await this.createAdminIfNotExists();
    }

    private async createAdminIfNotExists() {
        const adminExists = await this.userModel.findOne({
            where: { role: "ADMIN" },
        });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash("Kimxan110784@", 10); // Задайте сложный пароль!
            await this.userModel.create({
                phone: "admin",
                password: hashedPassword,
                role: "ADMIN",
            });

            console.log("✅ Админ создан: phone = admin, password = admin123");
        }
    }

    async register(createUserDto: CreateUserDto) {
        const { phone, password, role = UserRole.USER } = createUserDto;

        if (!phone || !password) {
            throw new HttpException(
                {
                    message: `Заполните все поля`,
                    statusCode: HttpStatus.BAD_REQUEST,
                },
                HttpStatus.BAD_REQUEST
            );
        }

        const existingUser = await this.userModel.findOne({ where: { phone } });
        if (existingUser) {
            throw new HttpException(
                {
                    message: `Пользователь с номером ${phone} уже зарегистрирован`,
                    statusCode: HttpStatus.CONFLICT,
                },
                HttpStatus.CONFLICT
            );
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await this.userModel.create({
                password: hashedPassword,
                phone,
                role,
            });

            return this.generateToken(user);
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка при создании пользователя: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async login(loginUserDto: LoginUserDto) {
        try {
            const { phone, password } = loginUserDto;

            const user = await this.userModel.findOne({ where: { phone } });
            if (!user) {
                throw new HttpException(
                    {
                        message: `Пользователь с номером ${phone} не зарегистрирован`,
                        statusCode: HttpStatus.UNAUTHORIZED,
                    },
                    HttpStatus.UNAUTHORIZED
                );
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );
            if (!isPasswordValid) {
                throw new HttpException(
                    {
                        message: "Неверный пароль",
                        statusCode: HttpStatus.UNAUTHORIZED,
                    },
                    HttpStatus.UNAUTHORIZED
                );
            }
            const data = {
                token: this.generateToken(user),
                role: user.role,
            };

            console.log(data);

            return data;
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка при входе пользователя: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getAllUsers() {
        try {
            const users = await this.userModel.findAll({
                attributes: { exclude: ["password"] },
            });
            if (users.length === 0) {
                throw new HttpException(
                    {
                        message: "Пользователи не найдены",
                        statusCode: HttpStatus.NOT_FOUND,
                    },
                    HttpStatus.NOT_FOUND
                );
            }
            return users;
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка при получении пользователей: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getUser(id: number) {
        if (isNaN(id) || id <= 0) {
            throw new HttpException(
                {
                    message: "Некорректный ID пользователя",
                    statusCode: HttpStatus.BAD_REQUEST,
                },
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            const user = await this.userModel.findByPk(id, {
                attributes: { exclude: ["password"] },
            });

            if (!user) {
                throw new HttpException(
                    {
                        message: "Пользователь не найден",
                        statusCode: HttpStatus.NOT_FOUND,
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            return user;
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка при получении пользователя: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto) {
        try {
            const user = await this.userModel.findByPk(id);

            if (!user) {
                throw new HttpException(
                    {
                        message: "Пользователь не найден",
                        statusCode: HttpStatus.NOT_FOUND,
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            let updateData = { ...updateUserDto }; // Создаём копию данных для обновления

            if (updateUserDto.password) {
                updateData.password = await bcrypt.hash(
                    updateUserDto.password,
                    10
                );
            }

            await user.update(updateData);

            await user.save();

            return {
                message: "Данные пользователя обновлены",
                user,
            };
        } catch (error) {
            throw new HttpException(
                {
                    message: `Ошибка при обновлении пользователя: ${error.message}`,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteUser(id: number) {
        const user = await this.userModel.findByPk(id);

        if (!user) {
            throw new HttpException(
                {
                    message: `Пользователь не найден`,
                    statusCode: HttpStatus.NOT_FOUND,
                },
                HttpStatus.NOT_FOUND
            );
        }

        await user.destroy();

        return {
            message: `Пользователь c ID ${user.id} успепшно удален`,
        };
    }

    private generateToken(user: User) {
        const payload = { id: user.id, phone: user.phone, role: user.role };
        const token = this.jwtService.sign(payload);

        return token;
    }
}
