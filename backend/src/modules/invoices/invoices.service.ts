import { InvoicesRepository, InvoiceStatus } from './invoices.repository';
import { CreateInvoiceInput, UpdateInvoiceInput } from './invoices.schema';
import { NotFoundError, AccountingError } from '../../utils/errors';
import { generateNextNumber } from '../../utils/accounting';
import prisma from '../../config/database';

export class InvoicesService {
    private repository: InvoicesRepository;

    constructor() {
        this.repository = new InvoicesRepository();
    }

    async getInvoices(
        page: number = 1,
        limit: number = 50,
        filters?: any
    ) {
        const skip = (page - 1) * limit;
        const { invoices, total } = await this.repository.findAll(skip, limit, filters);

        return {
            invoices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getInvoiceById(id: string) {
        const invoice = await this.repository.findById(id);
        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }
        return invoice;
    }

    async createInvoice(data: any, userId: string) {
        // Generate invoice number
        const invoiceNumber = await generateNextNumber('INV', 'invoice', 'invoiceNumber');

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        const items = await Promise.all(
            data.items.map(async (item: any) => {
                const itemTotal = item.quantity * item.unitPrice;
                subtotal += itemTotal;

                // Calculate tax if tax code is provided
                let itemTaxAmount = 0;
                if (item.taxCodeId) {
                    const taxCode = await prisma.taxCode.findUnique({
                        where: { id: item.taxCodeId },
                        include: {
                            taxRates: {
                                where: {
                                    effectiveFrom: { lte: new Date() },
                                    OR: [
                                        { effectiveTo: null },
                                        { effectiveTo: { gte: new Date() } },
                                    ],
                                },
                                orderBy: { effectiveFrom: 'desc' },
                                take: 1,
                            },
                        },
                    });

                    if (taxCode && taxCode.taxRates.length > 0) {
                        itemTaxAmount = (itemTotal * taxCode.taxRates[0].rate) / 100;
                        taxAmount += itemTaxAmount;
                    }
                }

                return {
                    productId: item.productId || undefined,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxCodeId: item.taxCodeId,
                    taxAmount: itemTaxAmount,
                    total: itemTotal + itemTaxAmount,
                };
            })
        );

        const discount = data.discount || 0;
        const total = subtotal + taxAmount - discount;

        // Calculate paid amount from payments
        const paidAmount = data.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;
        const balanceDue = total - paidAmount;

        // Create invoice with payments
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                customerId: data.customerId,
                date: new Date(data.date),
                dueDate: new Date(data.dueDate),
                reference: data.reference,
                notes: data.notes,
                subtotal,
                taxAmount,
                discount: data.discount || 0,
                total,
                paidAmount,
                balanceDue,
                status: InvoiceStatus.DRAFT,
                createdById: userId,
                items: {
                    create: items,
                },
                payments: {
                    create: data.payments || [],
                },
            },
            include: {
                items: true,
                payments: true,
                customer: true,
            },
        });

        return invoice;
    }

    async updateInvoice(id: string, data: UpdateInvoiceInput) {
        const invoice = await this.getInvoiceById(id);

        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new AccountingError('Only draft invoices can be updated');
        }

        // Recalculate if items are provided
        let updateData: any = {
            date: data.date ? new Date(data.date) : undefined,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            reference: data.reference,
            notes: data.notes,
        };

        if (data.items) {
            // Delete existing items
            await prisma.invoiceItem.deleteMany({
                where: { invoiceId: id },
            });

            // Recalculate totals
            let subtotal = 0;
            let taxAmount = 0;

            const items = await Promise.all(
                data.items.map(async (item) => {
                    const itemTotal = item.quantity * item.unitPrice;
                    subtotal += itemTotal;

                    let itemTaxAmount = 0;
                    if (item.taxCodeId) {
                        const taxCode = await prisma.taxCode.findUnique({
                            where: { id: item.taxCodeId },
                            include: {
                                taxRates: {
                                    where: {
                                        effectiveFrom: { lte: new Date() },
                                        OR: [
                                            { effectiveTo: null },
                                            { effectiveTo: { gte: new Date() } },
                                        ],
                                    },
                                    orderBy: { effectiveFrom: 'desc' },
                                    take: 1,
                                },
                            },
                        });

                        if (taxCode && taxCode.taxRates.length > 0) {
                            itemTaxAmount = (itemTotal * taxCode.taxRates[0].rate) / 100;
                            taxAmount += itemTaxAmount;
                        }
                    }

                    return {
                        productId: item.productId || undefined,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxCodeId: item.taxCodeId,
                        taxAmount: itemTaxAmount,
                        total: itemTotal + itemTaxAmount,
                    };
                })
            );

            const total = subtotal + taxAmount;

            updateData = {
                ...updateData,
                subtotal,
                taxAmount,
                total,
                balanceDue: total - invoice.paidAmount,
                items: {
                    create: items,
                },
            };
        }

        return await this.repository.update(id, updateData);
    }

    async deleteInvoice(id: string) {
        const invoice = await this.getInvoiceById(id);

        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new AccountingError('Only draft invoices can be deleted');
        }

        return await this.repository.delete(id);
    }

    async verifyInvoice(id: string, userId: string) {
        const invoice = await this.getInvoiceById(id);

        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new AccountingError('Only draft invoices can be verified');
        }

        return await this.repository.verifyInvoice(id, userId);
    }

    async approveInvoice(id: string, userId: string) {
        const invoice = await this.getInvoiceById(id);

        if (invoice.status !== InvoiceStatus.VERIFIED) {
            throw new AccountingError('Only verified invoices can be approved');
        }

        // Create journal entry based on payments
        await this.createInvoiceJournalEntry(id, userId);

        return await this.repository.approveInvoice(id, userId);
    }

    private async createInvoiceJournalEntry(invoiceId: string, userId: string) {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                payments: true,
                customer: true,
            },
        });

        if (!invoice) {
            throw new NotFoundError('Invoice not found');
        }

        // Get necessary accounts
        const cashAccount = await prisma.account.findFirst({
            where: { code: '1000', accountType: { type: 'ASSET' } },
        });

        const bankAccount = await prisma.account.findFirst({
            where: { code: '1100', accountType: { type: 'ASSET' } },
        });

        const accountsReceivableAccount = await prisma.account.findFirst({
            where: { code: '1200', accountType: { type: 'ASSET' } },
        });

        const revenueAccount = await prisma.account.findFirst({
            where: { code: '4000', accountType: { type: 'REVENUE' } },
        });

        const salesDiscountsAccount = await prisma.account.findFirst({
            where: { code: '4300', accountType: { type: 'REVENUE' } },
        });

        if (!cashAccount || !bankAccount || !accountsReceivableAccount || !revenueAccount) {
            throw new Error('Required accounts not found. Ensure Cash (1000), Bank (1100), A/R (1200), and Revenue (4000) exist.');
        }

        // Generate entry number
        const entryCount = await prisma.journalEntry.count();
        const entryNumber = `JE-${String(entryCount + 1).padStart(5, '0')}`;

        // Build journal entry lines
        const lines: any[] = [];

        // Add debit lines for each payment method
        invoice.payments?.forEach((payment: any) => {
            let accountId = cashAccount.id;
            let description = 'Cash payment';

            switch (payment.paymentMethod.toUpperCase()) {
                case 'CASH':
                    accountId = cashAccount.id;
                    description = `Cash payment from ${invoice.customer?.name}`;
                    break;
                case 'BANK':
                case 'BANK_TRANSFER':
                    accountId = bankAccount.id;
                    description = `Bank transfer from ${invoice.customer?.name}`;
                    break;
                case 'ONLINE':
                case 'ONLINE_PAYMENT':
                    accountId = bankAccount.id;
                    description = `Online payment from ${invoice.customer?.name}`;
                    break;
                default:
                    accountId = cashAccount.id;
                    description = `Payment from ${invoice.customer?.name}`;
            }

            lines.push({
                accountId,
                description,
                debit: payment.amount,
                credit: 0,
            });
        });

        // Add A/R debit if there's a balance due
        if (invoice.balanceDue > 0) {
            lines.push({
                accountId: accountsReceivableAccount.id,
                description: `Accounts Receivable from ${invoice.customer?.name}`,
                debit: invoice.balanceDue,
                credit: 0,
            });
        }

        // Add Sales Discounts debit if there's a discount
        if (invoice.discount > 0 && salesDiscountsAccount) {
            lines.push({
                accountId: salesDiscountsAccount.id,
                description: `Sales Discount for Invoice ${invoice.invoiceNumber}`,
                debit: invoice.discount,
                credit: 0,
            });
        }

        // Add revenue credit (subtotal before discount)
        lines.push({
            accountId: revenueAccount.id,
            description: `Revenue from Invoice ${invoice.invoiceNumber}`,
            debit: 0,
            credit: invoice.subtotal,
        });

        // Create journal entry
        await prisma.journalEntry.create({
            data: {
                entryNumber,
                date: new Date(invoice.date),
                description: `Invoice ${invoice.invoiceNumber} - ${invoice.customer?.name}`,
                reference: invoice.invoiceNumber,
                status: 'POSTED',
                createdById: userId,
                lines: {
                    create: lines,
                },
            },
        });
    }

    async rejectInvoice(id: string) {
        const invoice = await this.getInvoiceById(id);

        if (invoice.status === InvoiceStatus.APPROVED) {
            throw new AccountingError('Approved invoices cannot be rejected');
        }

        return await this.repository.rejectInvoice(id);
    }
}
