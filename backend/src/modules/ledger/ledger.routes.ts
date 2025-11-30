import { FastifyInstance } from 'fastify';
import { LedgerController } from './ledger.controller';
import { authenticate } from '../../middleware/auth';

export const ledgerRoutes = async (fastify: FastifyInstance) => {
    const controller = new LedgerController();

    fastify.addHook('preHandler', authenticate);

    fastify.get('/', controller.getLedgerEntries.bind(controller));
    fastify.get('/account/:accountId', controller.getAccountLedger.bind(controller));
};
