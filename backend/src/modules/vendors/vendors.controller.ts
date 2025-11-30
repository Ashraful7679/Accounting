import { FastifyRequest, FastifyReply } from 'fastify';
import { VendorsService } from './vendors.service';
import { createAuditLog } from '../../middleware/auditLog';

export class VendorsController {
    private service: VendorsService;

    constructor() {
        this.service = new VendorsService();
    }

    async getVendors(request: FastifyRequest, reply: FastifyReply) {
        const { page = 1, limit = 50, search } = request.query as any;
        const result = await this.service.getVendors(
            parseInt(page),
            parseInt(limit),
            search
        );

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getVendorById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const vendor = await this.service.getVendorById(id);

        return reply.send({
            success: true,
            data: vendor,
        });
    }

    async createVendor(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as any;
        const vendor = await this.service.createVendor(data);

        await createAuditLog(
            request,
            'CREATE' as any,
            'Vendor',
            vendor.id,
            undefined,
            vendor
        );

        return reply.status(201).send({
            success: true,
            data: vendor,
            message: 'Vendor created successfully',
        });
    }

    async updateVendor(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as any;

        const oldVendor = await this.service.getVendorById(id);
        const vendor = await this.service.updateVendor(id, data);

        await createAuditLog(
            request,
            'UPDATE' as any,
            'Vendor',
            vendor.id,
            oldVendor,
            vendor
        );

        return reply.send({
            success: true,
            data: vendor,
            message: 'Vendor updated successfully',
        });
    }

    async deleteVendor(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const vendor = await this.service.deleteVendor(id);

        await createAuditLog(
            request,
            'DELETE' as any,
            'Vendor',
            id,
            vendor,
            undefined
        );

        return reply.send({
            success: true,
            message: 'Vendor deleted successfully',
        });
    }
}
