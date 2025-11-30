import { PurchasesRepository } from './purchases.repository';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import prisma from '../../config/database';

export class PurchasesService {
    private repository: PurchasesRepository;

    constructor() {
        this.repository = new PurchasesRepository();
    }

    async createPurchase(data: any) {
        // Generate bill number
        const count = await prisma.bill.count();
        const billNumber = `BILL-${String(count + 1).padStart(5, '0')}`;

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        if (data.items && data.items.length > 0) {
            data.items.forEach((item: any) => {
                const itemTotal = item.quantity * item.unitPrice;
                subtotal += itemTotal;
                taxAmount += item.taxAmount || 0;
            });
        }

        const total = subtotal + taxAmount;

        const purchaseData = {
            ...data,
            billNumber,
            subtotal,
            taxAmount,
            total,
            balanceDue: total,
            status: 'DRAFT',
        };

        return await this.repository.create(purchaseData);
    }

    async getPurchases(filters: any) {
        return await this.repository.findAll(filters);
    }

    async getPurchaseById(id: string) {
        const purchase = await this.repository.findById(id);
        if (!purchase) {
            throw new NotFoundError('Purchase not found');
        }
        return purchase;
    }

    async updatePurchase(id: string, data: any) {
        const purchase = await this.repository.findById(id);
        if (!purchase) {
            throw new NotFoundError('Purchase not found');
        }

        if (purchase.status !== 'DRAFT') {
            throw new BadRequestError('Only draft purchases can be updated');
        }

        return await this.repository.update(id, data);
    }

    async deletePurchase(id: string) {
        const purchase = await this.repository.findById(id);
        if (!purchase) {
            throw new NotFoundError('Purchase not found');
        }

        if (purchase.status !== 'DRAFT') {
            throw new BadRequestError('Only draft purchases can be deleted');
        }

        return await this.repository.delete(id);
    }

    async verifyPurchase(id: string) {
        const purchase = await this.repository.findById(id);
        if (!purchase) {
            throw new NotFoundError('Purchase not found');
        }

        if (purchase.status !== 'DRAFT') {
            throw new BadRequestError('Only draft purchases can be verified');
        }

        return await this.repository.updateStatus(id, 'VERIFIED');
    }

    async approvePurchase(id: string) {
        const purchase = await this.repository.findById(id);
        if (!purchase) {
            throw new NotFoundError('Purchase not found');
        }

        if (purchase.status !== 'VERIFIED') {
            throw new BadRequestError('Only verified purchases can be approved');
        }

        // Update status to POSTED (approved)
        const updatedPurchase = await this.repository.updateStatus(id, 'POSTED');

        // Create journal entry for the purchase
        // This would debit Expense/Asset account and credit Accounts Payable
        // Implementation similar to invoice posting

        return updatedPurchase;
    }

    async rejectPurchase(id: string) {
        const purchase = await this.repository.findById(id);
        if (!purchase) {
            throw new NotFoundError('Purchase not found');
        }

        if (purchase.status === 'POSTED' || purchase.status === 'PAID') {
            throw new BadRequestError('Posted or paid purchases cannot be rejected');
        }

        return await this.repository.updateStatus(id, 'CANCELLED');
    }
}
