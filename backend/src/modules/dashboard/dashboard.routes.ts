import { FastifyInstance } from 'fastify';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';

export const dashboardRoutes = async (fastify: FastifyInstance) => {
    const controller = new DashboardController();

    fastify.addHook('preHandler', authenticate);

    fastify.get('/stats', controller.getDashboardStats.bind(controller));
    fastify.get('/chart', controller.getRevenueExpenseChart.bind(controller));
};
