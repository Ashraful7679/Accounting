import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductsService } from './products.service';
import { createAuditLog } from '../../middleware/auditLog';

export class ProductsController {
    private service: ProductsService;

    constructor() {
        this.service = new ProductsService();
    }

    async getProducts(request: FastifyRequest, reply: FastifyReply) {
        const { page = 1, limit = 50, search } = request.query as any;
        const result = await this.service.getProducts(
            parseInt(page),
            parseInt(limit),
            search
        );

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getProductById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const product = await this.service.getProductById(id);

        return reply.send({
            success: true,
            data: product,
        });
    }

    async createProduct(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as any;
        const product = await this.service.createProduct(data);

        await createAuditLog(
            request,
            'CREATE' as any,
            'Product',
            product.id,
            undefined,
            product
        );

        return reply.status(201).send({
            success: true,
            data: product,
            message: 'Product created successfully',
        });
    }

    async updateProduct(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as any;

        const oldProduct = await this.service.getProductById(id);
        const product = await this.service.updateProduct(id, data);

        await createAuditLog(
            request,
            'UPDATE' as any,
            'Product',
            product.id,
            oldProduct,
            product
        );

        return reply.send({
            success: true,
            data: product,
            message: 'Product updated successfully',
        });
    }

    async deleteProduct(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const product = await this.service.deleteProduct(id);

        await createAuditLog(
            request,
            'DELETE' as any,
            'Product',
            id,
            product,
            undefined
        );

        return reply.send({
            success: true,
            message: 'Product deleted successfully',
        });
    }
}
