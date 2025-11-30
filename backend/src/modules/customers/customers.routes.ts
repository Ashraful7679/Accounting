import { FastifyInstance } from 'fastify';
import { CustomersController } from './customers.controller';
import { authenticate } from '../../middleware/auth';

export const customersRoutes = async (fastify: FastifyInstance) => {
    const controller = new CustomersController();

    // All routes require authentication
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', controller.getCustomers.bind(controller));
    fastify.get('/:id', controller.getCustomerById.bind(controller));
    fastify.post('/', controller.createCustomer.bind(controller));
    fastify.put('/:id', controller.updateCustomer.bind(controller));
    fastify.delete('/:id', controller.deleteCustomer.bind(controller));
};
