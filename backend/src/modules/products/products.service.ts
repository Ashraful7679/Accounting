import { ProductsRepository } from './products.repository';
import { ConflictError, NotFoundError } from '../../utils/errors';

export class ProductsService {
    private repository: ProductsRepository;

    constructor() {
        this.repository = new ProductsRepository();
    }

    async getProducts(page: number = 1, limit: number = 50, search?: string) {
        const skip = (page - 1) * limit;
        const { products, total } = await this.repository.findAll(skip, limit, search);

        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getProductById(id: string) {
        const product = await this.repository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        return product;
    }

    async createProduct(data: any) {
        if (!data.code) {
            data.code = await this.repository.getNextCode();
        } else {
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                throw new ConflictError('Product code already exists');
            }
        }

        return await this.repository.create(data);
    }

    async updateProduct(id: string, data: any) {
        const product = await this.repository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        if (data.code && data.code !== product.code) {
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                throw new ConflictError('Product code already exists');
            }
        }

        return await this.repository.update(id, data);
    }

    async deleteProduct(id: string) {
        const product = await this.repository.findById(id);
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        return await this.repository.delete(id);
    }
}
