import { FastifyRequest, FastifyReply } from 'fastify';
import { DashboardService } from './dashboard.service';

export class DashboardController {
    private service: DashboardService;

    constructor() {
        this.service = new DashboardService();
    }

    async getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await this.service.getDashboardStats();

        return reply.send({
            success: true,
            data: stats,
        });
    }

    async getRevenueExpenseChart(request: FastifyRequest, reply: FastifyReply) {
        const { months = 6 } = request.query as any;
        const data = await this.service.getRevenueExpenseChart(parseInt(months));

        return reply.send({
            success: true,
            data: data,
        });
    }
}
