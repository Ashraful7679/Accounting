import prisma from '../../config/database';
import type { User } from '@prisma/client';

export class AuthRepository {
    async findUserByEmail(email: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { email },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
    }

    async findUserById(id: string): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { id },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
    }

    async createUser(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<User> {
        return await prisma.user.create({
            data,
        });
    }

    async assignRole(userId: string, roleId: string) {
        return await prisma.userRole.create({
            data: {
                userId,
                roleId,
            },
        });
    }

    async updatePassword(userId: string, password: string) {
        return await prisma.user.update({
            where: { id: userId },
            data: { password },
        });
    }

    async findAll() {
        return await prisma.user.findMany({
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateUser(userId: string, data: {
        email?: string;
        firstName?: string;
        lastName?: string;
        password?: string;
    }) {
        return await prisma.user.update({
            where: { id: userId },
            data,
        });
    }

    async deleteUser(userId: string) {
        return await prisma.user.delete({
            where: { id: userId },
        });
    }

    async removeUserRoles(userId: string) {
        return await prisma.userRole.deleteMany({
            where: { userId },
        });
    }

    async findAllRoles() {
        return await prisma.role.findMany({
            orderBy: { name: 'asc' },
        });
    }
}
