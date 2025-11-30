import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportsService } from './reports.service';

export class ReportsController {
    private service: ReportsService;

    constructor() {
        this.service = new ReportsService();
    }

    async getTrialBalance(request: FastifyRequest, reply: FastifyReply) {
        const { startDate, endDate } = request.query as any;
        const result = await this.service.getTrialBalance(startDate, endDate);

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getProfitAndLoss(request: FastifyRequest, reply: FastifyReply) {
        const { startDate, endDate } = request.query as any;

        if (!startDate || !endDate) {
            return reply.status(400).send({
                success: false,
                error: { message: 'Start date and end date are required' },
            });
        }

        const result = await this.service.getProfitAndLoss(startDate, endDate);

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getBalanceSheet(request: FastifyRequest, reply: FastifyReply) {
        const { asOfDate } = request.query as any;

        if (!asOfDate) {
            return reply.status(400).send({
                success: false,
                error: { message: 'As of date is required' },
            });
        }

        const result = await this.service.getBalanceSheet(asOfDate);

        return reply.send({
            success: true,
            data: result,
        });
    }
}
