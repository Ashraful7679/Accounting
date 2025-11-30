import { FastifyRequest, FastifyReply } from 'fastify';
import { CustomersService } from './customers.service';
import { createAuditLog } from '../../middleware/auditLog';

export class CustomersController {
    private service: CustomersService;

    constructor() {
        this.service = new CustomersService();
    }

    async getCustomers(request: FastifyRequest, reply: FastifyReply) {
        const { page = 1, limit = 50, search } = request.query as any;
        const result = await this.service.getCustomers(
            parseInt(page),
            parseInt(limit),
            search
        );

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getCustomerById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const customer = await this.service.getCustomerById(id);

        return reply.send({
            success: true,
            data: customer,
        });
    }

    async createCustomer(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as any;
        const customer = await this.service.createCustomer(data);

        await createAuditLog(
            request,
            'CREATE' as any,
            'Customer',
            customer.id,
            undefined,
            customer
        );

        return reply.status(201).send({
            success: true,
            data: customer,
            message: 'Customer created successfully',
        });
    }

    async updateCustomer(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as any;

        const oldCustomer = await this.service.getCustomerById(id);
        const customer = await this.service.updateCustomer(id, data);

        await createAuditLog(
            request,
            'UPDATE' as any,
            'Customer',
            customer.id,
            oldCustomer,
            customer
        );

        return reply.send({
            success: true,
            data: customer,
            message: 'Customer updated successfully',
        });
    }

    async deleteCustomer(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const customer = await this.service.deleteCustomer(id);

        await createAuditLog(
            request,
            'DELETE' as any,
            'Customer',
            id,
            customer,
            undefined
        );

        return reply.send({
            success: true,
            message: 'Customer deleted successfully',
        });
    }
}
