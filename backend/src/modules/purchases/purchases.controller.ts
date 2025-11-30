import { FastifyRequest, FastifyReply } from 'fastify';
import { PurchasesService } from './purchases.service';

export class PurchasesController {
    private service: PurchasesService;

    constructor() {
        this.service = new PurchasesService();
    }

    async createPurchase(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as any;
        const purchase = await this.service.createPurchase({
            ...data,
            createdById: request.user!.id,
        });

        return reply.status(201).send({
            success: true,
            data: purchase,
            message: 'Purchase created successfully',
        });
    }

    async getPurchases(request: FastifyRequest, reply: FastifyReply) {
        const { search, status, limit, offset } = request.query as any;
        const result = await this.service.getPurchases({
            search,
            status,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
        });

        return reply.send({
            success: true,
            data: {
                purchases: result.bills,
                total: result.total,
            },
        });
    }

    async getPurchaseById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const purchase = await this.service.getPurchaseById(id);

        return reply.send({
            success: true,
            data: purchase,
        });
    }

    async updatePurchase(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as any;
        const purchase = await this.service.updatePurchase(id, data);

        return reply.send({
            success: true,
            data: purchase,
            message: 'Purchase updated successfully',
        });
    }

    async deletePurchase(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        await this.service.deletePurchase(id);

        return reply.send({
            success: true,
            message: 'Purchase deleted successfully',
        });
    }

    async verifyPurchase(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const purchase = await this.service.verifyPurchase(id);

        return reply.send({
            success: true,
            data: purchase,
            message: 'Purchase verified successfully',
        });
    }

    async approvePurchase(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const purchase = await this.service.approvePurchase(id);

        return reply.send({
            success: true,
            data: purchase,
            message: 'Purchase approved successfully',
        });
    }

    async rejectPurchase(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const purchase = await this.service.rejectPurchase(id);

        return reply.send({
            success: true,
            data: purchase,
            message: 'Purchase rejected successfully',
        });
    }
}
