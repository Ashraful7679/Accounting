import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentsReceivedService } from './payments-received.service';
import { createAuditLog } from '../../middleware/auditLog';

export class PaymentsReceivedController {
    private service: PaymentsReceivedService;

    constructor() {
        this.service = new PaymentsReceivedService();
    }

    async getPayments(request: FastifyRequest, reply: FastifyReply) {
        const { page = 1, limit = 50, search } = request.query as any;
        const result = await this.service.getPayments(
            parseInt(page),
            parseInt(limit),
            search
        );

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getPaymentById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const payment = await this.service.getPaymentById(id);

        return reply.send({
            success: true,
            data: payment,
        });
    }

    async createPayment(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as any;
        const payment = await this.service.createPayment(data);

        await createAuditLog(
            request,
            'CREATE' as any,
            'PaymentReceived',
            payment.id,
            undefined,
            payment
        );

        return reply.status(201).send({
            success: true,
            data: payment,
            message: 'Payment recorded successfully',
        });
    }

    async updatePayment(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as any;

        const oldPayment = await this.service.getPaymentById(id);
        const payment = await this.service.updatePayment(id, data);

        await createAuditLog(
            request,
            'UPDATE' as any,
            'PaymentReceived',
            payment.id,
            oldPayment,
            payment
        );

        return reply.send({
            success: true,
            data: payment,
            message: 'Payment updated successfully',
        });
    }

    async deletePayment(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const payment = await this.service.deletePayment(id);

        await createAuditLog(
            request,
            'DELETE' as any,
            'PaymentReceived',
            id,
            payment,
            undefined
        );

        return reply.send({
            success: true,
            message: 'Payment deleted successfully',
        });
    }
}
