import { FastifyRequest, FastifyReply } from 'fastify';
import { LedgerService } from './ledger.service';

export class LedgerController {
    private service: LedgerService;

    constructor() {
        this.service = new LedgerService();
    }

    async getLedgerEntries(request: FastifyRequest, reply: FastifyReply) {
        const { page = 1, limit = 100, accountId, startDate, endDate, search } = request.query as any;
        const result = await this.service.getLedgerEntries(
            parseInt(page),
            parseInt(limit),
            accountId,
            startDate,
            endDate,
            search
        );

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getAccountLedger(request: FastifyRequest, reply: FastifyReply) {
        const { accountId } = request.params as { accountId: string };
        const { startDate, endDate } = request.query as any;

        const entries = await this.service.getAccountLedger(accountId, startDate, endDate);

        return reply.send({
            success: true,
            data: entries,
        });
    }
}
