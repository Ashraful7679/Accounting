import { FastifyInstance } from 'fastify';
import { VendorsController } from './vendors.controller';
import { authenticate } from '../../middleware/auth';

export const vendorsRoutes = async (fastify: FastifyInstance) => {
    const controller = new VendorsController();

    fastify.addHook('preHandler', authenticate);

    fastify.get('/', controller.getVendors.bind(controller));
    fastify.get('/:id', controller.getVendorById.bind(controller));
    fastify.post('/', controller.createVendor.bind(controller));
    fastify.put('/:id', controller.updateVendor.bind(controller));
    fastify.delete('/:id', controller.deleteVendor.bind(controller));
};
