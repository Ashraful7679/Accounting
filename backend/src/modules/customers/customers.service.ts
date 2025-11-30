import { CustomersRepository } from './customers.repository';
import { ConflictError, NotFoundError } from '../../utils/errors';

export class CustomersService {
    private repository: CustomersRepository;

    constructor() {
        this.repository = new CustomersRepository();
    }

    async getCustomers(page: number = 1, limit: number = 50, search?: string) {
        const skip = (page - 1) * limit;
        const { customers, total } = await this.repository.findAll(skip, limit, search);

        return {
            customers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getCustomerById(id: string) {
        const customer = await this.repository.findById(id);
        if (!customer) {
            throw new NotFoundError('Customer not found');
        }
        return customer;
    }

    async createCustomer(data: any) {
        // Auto-generate code if not provided
        if (!data.code) {
            data.code = await this.repository.getNextCode();
        } else {
            // Check if code already exists
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                throw new ConflictError('Customer code already exists');
            }
        }

        return await this.repository.create(data);
    }

    async updateCustomer(id: string, data: any) {
        const customer = await this.repository.findById(id);
        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        // If code is being updated, check for conflicts
        if (data.code && data.code !== customer.code) {
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                throw new ConflictError('Customer code already exists');
            }
        }

        return await this.repository.update(id, data);
    }

    async deleteCustomer(id: string) {
        const customer = await this.repository.findById(id);
        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        // Check if customer has invoices
        if (customer.invoices && customer.invoices.length > 0) {
            throw new ConflictError('Cannot delete customer with existing invoices');
        }

        return await this.repository.delete(id);
    }
}
