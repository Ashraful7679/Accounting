import { FastifyInstance } from 'fastify';
import { InvoicesController } from './invoices.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { requireAdmin, requireAdminOrManager } from '../../middleware/roles';
import { createInvoiceSchema, updateInvoiceSchema } from './invoices.schema';

export const invoicesRoutes = async (fastify: FastifyInstance) => {
    const controller = new InvoicesController();

    // All routes require authentication
    fastify.addHook('preHandler', authenticate);

    fastify.get('/', controller.getInvoices.bind(controller));
    fastify.get('/:id', controller.getInvoiceById.bind(controller));
    fastify.get('/:id/pdf', controller.downloadInvoicePDF.bind(controller));

    fastify.post(
        '/',
        { preHandler: validate(createInvoiceSchema) },
        controller.createInvoice.bind(controller)
    );

    fastify.put(
        '/:id',
        { preHandler: validate(updateInvoiceSchema) },
        controller.updateInvoice.bind(controller)
    );

    fastify.delete('/:id', controller.deleteInvoice.bind(controller));
    fastify.post('/:id/post', controller.postInvoice.bind(controller));

    // Verify requires admin or manager
    fastify.post('/:id/verify', { preHandler: requireAdminOrManager }, controller.verifyInvoice.bind(controller));

    // Approve requires admin only
    fastify.post('/:id/approve', { preHandler: requireAdmin }, controller.approveInvoice.bind(controller));

    // Reject requires admin or manager
    fastify.post('/:id/reject', { preHandler: requireAdminOrManager }, controller.rejectInvoice.bind(controller));
};
