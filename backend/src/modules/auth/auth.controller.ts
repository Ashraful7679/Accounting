import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput } from './auth.schema';
import { createAuditLog } from '../../middleware/auditLog';

export class AuthController {
    private service: AuthService;

    constructor() {
        this.service = new AuthService();
    }

    async register(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as RegisterInput;
        const user = await this.service.register(data);

        return reply.status(201).send({
            success: true,
            data: user,
            message: 'User registered successfully',
        });
    }

    async login(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as LoginInput;
        const user = await this.service.login(data);

        // Generate JWT token
        const token = request.server.jwt.sign({
            id: user.id,
            email: user.email,
        });

        // Generate refresh token
        const refreshToken = request.server.jwt.sign(
            { id: user.id, email: user.email },
            { expiresIn: '30d' }
        );

        // Create audit log
        await createAuditLog(
            { ...request, user: { id: user.id, email: user.email } } as any,
            'LOGIN',
            'User',
            user.id
        );

        return reply.send({
            success: true,
            data: {
                user,
                token,
                refreshToken,
            },
            message: 'Login successful',
        });
    }

    async getMe(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.id;
        const user = await this.service.getUserById(userId);

        return reply.send({
            success: true,
            data: user,
        });
    }

    async logout(request: FastifyRequest, reply: FastifyReply) {
        // Create audit log
        await createAuditLog(
            request,
            'LOGOUT',
            'User',
            request.user!.id
        );

        return reply.send({
            success: true,
            message: 'Logout successful',
        });
    }

    async changePassword(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.id;
        const { oldPassword, newPassword } = request.body as {
            oldPassword: string;
            newPassword: string;
        };

        await this.service.changePassword(userId, oldPassword, newPassword);

        return reply.send({
            success: true,
            message: 'Password changed successfully',
        });
    }

    async refreshToken(request: FastifyRequest, reply: FastifyReply) {
        const { refreshToken } = request.body as { refreshToken: string };

        try {
            const decoded = request.server.jwt.verify(refreshToken) as {
                id: string;
                email: string;
            };

            // Generate new access token
            const newToken = request.server.jwt.sign({
                id: decoded.id,
                email: decoded.email,
            });

            return reply.send({
                success: true,
                data: { token: newToken },
            });
        } catch (error) {
            return reply.status(401).send({
                success: false,
                error: { message: 'Invalid refresh token' },
            });
        }
    }

    async getUsers(request: FastifyRequest, reply: FastifyReply) {
        const users = await this.service.getUsers();
        return reply.send({
            success: true,
            data: { users },
        });
    }

    async updateUser(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as any;
        const user = await this.service.updateUser(id, data);

        return reply.send({
            success: true,
            data: user,
            message: 'User updated successfully',
        });
    }

    async deleteUser(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        await this.service.deleteUser(id);

        return reply.send({
            success: true,
            message: 'User deleted successfully',
        });
    }

    async getRoles(request: FastifyRequest, reply: FastifyReply) {
        const roles = await this.service.getRoles();
        return reply.send({
            success: true,
            data: { roles },
        });
    }
}
