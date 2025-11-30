import bcrypt from 'bcryptjs';
import { AuthRepository } from './auth.repository';
import { UnauthorizedError, ConflictError } from '../../utils/errors';
import { RegisterInput, LoginInput } from './auth.schema';
import prisma from '../../config/database';

export class AuthService {
    private repository: AuthRepository;

    constructor() {
        this.repository = new AuthRepository();
    }

    async register(data: RegisterInput) {
        // Check if user already exists
        const existingUser = await this.repository.findUserByEmail(data.email);
        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user
        const user = await this.repository.createUser({
            ...data,
            password: hashedPassword,
        });

        // Assign default role (User)
        const userRole = await prisma.role.findFirst({
            where: { name: 'User' },
        });

        if (userRole) {
            await this.repository.assignRole(user.id, userRole.id);
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async login(data: LoginInput) {
        // Find user
        const user = await this.repository.findUserByEmail(data.email);
        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedError('Account is deactivated');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Remove password from response and transform userRoles to roles
        const { password, userRoles, ...userWithoutPassword } = user as any;

        // Transform userRoles to roles array for frontend
        const roles = userRoles?.map((ur: any) => ur.role) || [];

        return {
            ...userWithoutPassword,
            roles,
        };
    }

    async getUserById(id: string) {
        const user = await this.repository.findUserById(id);
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Remove password from response and transform userRoles to roles
        const { password, userRoles, ...userWithoutPassword } = user as any;

        // Transform userRoles to roles array for frontend
        const roles = userRoles?.map((ur: any) => ur.role) || [];

        return {
            ...userWithoutPassword,
            roles,
        };
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await this.repository.findUserById(userId);
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid old password');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await this.repository.updatePassword(userId, hashedPassword);
    }

    async getUsers() {
        const users = await this.repository.findAll();
        return users.map((user: any) => {
            const { password, userRoles, ...userWithoutPassword } = user;
            const roles = userRoles?.map((ur: any) => ur.role.name) || [];
            return {
                ...userWithoutPassword,
                roles,
                name: `${user.firstName} ${user.lastName}`,
            };
        });
    }

    async updateUser(userId: string, data: {
        email?: string;
        firstName?: string;
        lastName?: string;
        password?: string;
        roleIds?: string[];
    }) {
        // Hash password if provided
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        // Update user
        const { roleIds, ...userData } = data;
        const user = await this.repository.updateUser(userId, userData);

        // Update roles if provided
        if (roleIds && roleIds.length > 0) {
            await this.repository.removeUserRoles(userId);
            for (const roleId of roleIds) {
                await this.repository.assignRole(userId, roleId);
            }
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async deleteUser(userId: string) {
        return await this.repository.deleteUser(userId);
    }

    async getRoles() {
        return await this.repository.findAllRoles();
    }
}
