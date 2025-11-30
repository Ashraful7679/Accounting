import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { registerSchema, loginSchema } from './auth.schema';

export const authRoutes = async (fastify: FastifyInstance) => {
    const controller = new AuthController();

    // Public routes
    fastify.post(
        '/register',
        {
            preHandler: validate(registerSchema),
        },
        controller.register.bind(controller)
    );

    fastify.post(
        '/login',
        {
            preHandler: validate(loginSchema),
        },
        controller.login.bind(controller)
    );

    fastify.post('/refresh', controller.refreshToken.bind(controller));

    // Protected routes
    fastify.get(
        '/me',
        {
            preHandler: authenticate,
        },
        controller.getMe.bind(controller)
    );

    fastify.post(
        '/logout',
        {
            preHandler: authenticate,
        },
        controller.logout.bind(controller)
    );

    fastify.post(
        '/change-password',
        {
            preHandler: authenticate,
        },
        controller.changePassword.bind(controller)
    );

    // User management routes
    fastify.get(
        '/users',
        {
            preHandler: authenticate,
        },
        controller.getUsers.bind(controller)
    );

    fastify.put(
        '/users/:id',
        {
            preHandler: authenticate,
        },
        controller.updateUser.bind(controller)
    );

    fastify.delete(
        '/users/:id',
        {
            preHandler: authenticate,
        },
        controller.deleteUser.bind(controller)
    );

    fastify.get(
        '/roles',
        {
            preHandler: authenticate,
        },
        controller.getRoles.bind(controller)
    );
};
