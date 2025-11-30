import { VendorsRepository } from './vendors.repository';
import { ConflictError, NotFoundError } from '../../utils/errors';

export class VendorsService {
    private repository: VendorsRepository;

    constructor() {
        this.repository = new VendorsRepository();
    }

    async getVendors(page: number = 1, limit: number = 50, search?: string) {
        const skip = (page - 1) * limit;
        const { vendors, total } = await this.repository.findAll(skip, limit, search);

        return {
            vendors,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getVendorById(id: string) {
        const vendor = await this.repository.findById(id);
        if (!vendor) {
            throw new NotFoundError('Vendor not found');
        }
        return vendor;
    }

    async createVendor(data: any) {
        if (!data.code) {
            data.code = await this.repository.getNextCode();
        } else {
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                throw new ConflictError('Vendor code already exists');
            }
        }

        return await this.repository.create(data);
    }

    async updateVendor(id: string, data: any) {
        const vendor = await this.repository.findById(id);
        if (!vendor) {
            throw new NotFoundError('Vendor not found');
        }

        if (data.code && data.code !== vendor.code) {
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                throw new ConflictError('Vendor code already exists');
            }
        }

        return await this.repository.update(id, data);
    }

    async deleteVendor(id: string) {
        const vendor = await this.repository.findById(id);
        if (!vendor) {
            throw new NotFoundError('Vendor not found');
        }

        if (vendor.bills && vendor.bills.length > 0) {
            throw new ConflictError('Cannot delete vendor with existing bills');
        }

        return await this.repository.delete(id);
    }
}
