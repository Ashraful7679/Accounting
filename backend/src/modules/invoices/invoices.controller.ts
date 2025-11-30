import { FastifyRequest, FastifyReply } from 'fastify';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceInput, UpdateInvoiceInput } from './invoices.schema';
import { createAuditLog } from '../../middleware/auditLog';
import { generateInvoicePDF } from '../../utils/pdf';

export class InvoicesController {
    private service: InvoicesService;

    constructor() {
        this.service = new InvoicesService();
    }

    async getInvoices(request: FastifyRequest, reply: FastifyReply) {
        const { page = 1, limit = 50, customerId, status, dateFrom, dateTo } = request.query as any;

        const filters: any = {};
        if (customerId) filters.customerId = customerId;
        if (status) filters.status = status;
        if (dateFrom) filters.dateFrom = new Date(dateFrom);
        if (dateTo) filters.dateTo = new Date(dateTo);

        const result = await this.service.getInvoices(
            parseInt(page),
            parseInt(limit),
            filters
        );

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getInvoiceById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const invoice = await this.service.getInvoiceById(id);

        return reply.send({
            success: true,
            data: invoice,
        });
    }

    async createInvoice(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as CreateInvoiceInput;
        const userId = request.user!.id;

        const invoice = await this.service.createInvoice(data, userId);

        await createAuditLog(
            request,
            'CREATE',
            'Invoice',
            invoice.id,
            undefined,
            invoice
        );

        return reply.status(201).send({
            success: true,
            data: invoice,
            message: 'Invoice created successfully',
        });
    }

    async updateInvoice(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as UpdateInvoiceInput;

        const oldInvoice = await this.service.getInvoiceById(id);
        const invoice = await this.service.updateInvoice(id, data);

        await createAuditLog(
            request,
            'UPDATE',
            'Invoice',
            invoice.id,
            oldInvoice,
            invoice
        );

        return reply.send({
            success: true,
            data: invoice,
            message: 'Invoice updated successfully',
        });
    }

    async deleteInvoice(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const invoice = await this.service.deleteInvoice(id);

        await createAuditLog(
            request,
            'DELETE',
            'Invoice',
            id,
            invoice,
            undefined
        );

        return reply.send({
            success: true,
            message: 'Invoice deleted successfully',
        });
    }

    async postInvoice(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const userId = request.user!.id;

        const invoice = await this.service.postInvoice(id, userId);

        await createAuditLog(
            request,
            'UPDATE',
            'Invoice',
            id,
            { status: 'DRAFT' },
            { status: 'POSTED' }
        );

        return reply.send({
            success: true,
            data: invoice,
            message: 'Invoice posted successfully',
        });
    }

    async downloadInvoicePDF(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const invoice = await this.service.getInvoiceById(id);

        const pdf = await generateInvoicePDF(invoice);

        return reply
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`)
            .send(pdf);
    }

    async verifyInvoice(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const userId = request.user!.id;

        const invoice = await this.service.verifyInvoice(id, userId);

        await createAuditLog(
            request,
            'UPDATE',
            'Invoice',
            id,
            { status: 'DRAFT' },
            { status: 'VERIFIED' }
        );

        return reply.send({
            success: true,
            data: invoice,
            message: 'Invoice verified successfully',
        });
    }

    async approveInvoice(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const userId = request.user!.id;

        const invoice = await this.service.approveInvoice(id, userId);

        await createAuditLog(
            request,
            'UPDATE',
            'Invoice',
            id,
            { status: 'VERIFIED' },
            { status: 'APPROVED' }
        );

        return reply.send({
            success: true,
            data: invoice,
            message: 'Invoice approved successfully',
        });
    }

    async rejectInvoice(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };

        const invoice = await this.service.rejectInvoice(id);

        await createAuditLog(
            request,
            'UPDATE',
            'Invoice',
            id,
            { status: invoice.status },
            { status: 'DRAFT' }
        );

        return reply.send({
            success: true,
            data: invoice,
            message: 'Invoice rejected successfully',
        });
    }
}
