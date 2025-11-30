import { FastifyInstance } from 'fastify';
import { PaymentsReceivedController } from './payments-received.controller';
import { authenticate } from '../../middleware/auth';

export const paymentsReceivedRoutes = async (fastify: FastifyInstance) => {
    const controller = new PaymentsReceivedController();

    fastify.addHook('preHandler', authenticate);

    fastify.get('/', controller.getPayments.bind(controller));
    fastify.get('/:id', controller.getPaymentById.bind(controller));
    fastify.post('/', controller.createPayment.bind(controller));
    fastify.put('/:id', controller.updatePayment.bind(controller));
    fastify.delete('/:id', controller.deletePayment.bind(controller));
};
