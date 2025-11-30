import { FastifyInstance } from 'fastify';
import { AccountsController } from './accounts.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createAccountSchema, updateAccountSchema } from './accounts.schema';

export const accountsRoutes = async (fastify: FastifyInstance) => {
    const controller = new AccountsController();

    // All routes require authentication
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', controller.getAccounts.bind(controller));
    fastify.get('/types', controller.getAccountTypes.bind(controller));
    fastify.get('/tree', controller.getAccountTree.bind(controller));
    fastify.get('/:id', controller.getAccountById.bind(controller));

    fastify.post(
        '/',
        { preHandler: validate(createAccountSchema) },
        controller.createAccount.bind(controller)
    );

    fastify.put(
        '/:id',
        { preHandler: validate(updateAccountSchema) },
        controller.updateAccount.bind(controller)
    );

    fastify.delete('/:id', controller.deleteAccount.bind(controller));
};
