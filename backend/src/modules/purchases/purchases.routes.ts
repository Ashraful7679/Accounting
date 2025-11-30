import { FastifyInstance } from 'fastify';
import { PurchasesController } from './purchases.controller';
import { authenticate } from '../../middleware/auth';

export const purchasesRoutes = async (fastify: FastifyInstance) => {
    const controller = new PurchasesController();

    // All routes require authentication
    fastify.get(
        '/',
        {
            preHandler: authenticate,
        },
        controller.getPurchases.bind(controller)
    );

    fastify.post(
        '/',
        {
            preHandler: authenticate,
        },
        controller.createPurchase.bind(controller)
    );

    fastify.get(
        '/:id',
        {
            preHandler: authenticate,
        },
        controller.getPurchaseById.bind(controller)
    );

    fastify.put(
        '/:id',
        {
            preHandler: authenticate,
        },
        controller.updatePurchase.bind(controller)
    );

    fastify.delete(
        '/:id',
        {
            preHandler: authenticate,
        },
        controller.deletePurchase.bind(controller)
    );

    fastify.post(
        '/:id/verify',
        {
            preHandler: authenticate,
        },
        controller.verifyPurchase.bind(controller)
    );

    fastify.post(
        '/:id/approve',
        {
            preHandler: authenticate,
        },
        controller.approvePurchase.bind(controller)
    );

    fastify.post(
        '/:id/reject',
        {
            preHandler: authenticate,
        },
        controller.rejectPurchase.bind(controller)
    );
};
