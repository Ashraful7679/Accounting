import { FastifyInstance } from 'fastify';
import { ProductsController } from './products.controller';
import { authenticate } from '../../middleware/auth';

export const productsRoutes = async (fastify: FastifyInstance) => {
    const controller = new ProductsController();

    fastify.addHook('preHandler', authenticate);

    fastify.get('/', controller.getProducts.bind(controller));
    fastify.get('/:id', controller.getProductById.bind(controller));
    fastify.post('/', controller.createProduct.bind(controller));
    fastify.put('/:id', controller.updateProduct.bind(controller));
    fastify.delete('/:id', controller.deleteProduct.bind(controller));
};
