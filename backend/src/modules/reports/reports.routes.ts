import { FastifyInstance } from 'fastify';
import { ReportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';

export const reportsRoutes = async (fastify: FastifyInstance) => {
    const controller = new ReportsController();

    fastify.addHook('preHandler', authenticate);

    fastify.get('/trial-balance', controller.getTrialBalance.bind(controller));
    fastify.get('/profit-loss', controller.getProfitAndLoss.bind(controller));
    fastify.get('/balance-sheet', controller.getBalanceSheet.bind(controller));
};
