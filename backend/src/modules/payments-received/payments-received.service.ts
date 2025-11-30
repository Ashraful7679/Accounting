import { PaymentsReceivedRepository } from './payments-received.repository';
import { NotFoundError } from '../../utils/errors';
import prisma from '../../config/database';

export class PaymentsReceivedService {
    private repository: PaymentsReceivedRepository;

    constructor() {
        this.repository = new PaymentsReceivedRepository();
    }

    async getPayments(page: number = 1, limit: number = 50, search?: string) {
        const skip = (page - 1) * limit;
        const { payments, total } = await this.repository.findAll(skip, limit, search);

        return {
            payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPaymentById(id: string) {
        const payment = await this.repository.findById(id);
        if (!payment) {
            throw new NotFoundError('Payment not found');
        }
        return payment;
    }

    async createPayment(data: any) {
        if (!data.paymentNumber) {
            data.paymentNumber = await this.repository.getNextNumber();
        }

        // Create payment, update invoice/customer balances, and create journal entries in a transaction
        return await prisma.$transaction(async (tx) => {
            const payment = await this.repository.create(data);

            let invoice = null;
            let isFullPayment = false;

            // Update invoice paid amount if invoice is specified
            if (data.invoiceId) {
                invoice = await tx.invoice.findUnique({
                    where: { id: data.invoiceId },
                    include: {
                        items: true,
                    },
                });

                if (invoice) {
                    const newPaidAmount = invoice.paidAmount + data.amount;
                    const newBalanceDue = invoice.total - newPaidAmount;
                    isFullPayment = newBalanceDue === 0;

                    await tx.invoice.update({
                        where: { id: data.invoiceId },
                        data: {
                            paidAmount: newPaidAmount,
                            balanceDue: newBalanceDue,
                            status: isFullPayment ? 'PAID' : newBalanceDue < invoice.total ? 'PARTIALLY_PAID' : invoice.status,
                        },
                    });
                }
            }

            // Update customer balance
            const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
            if (customer) {
                await tx.customer.update({
                    where: { id: data.customerId },
                    data: {
                        currentBalance: customer.currentBalance - data.amount,
                    },
                });
            }

            // Create journal entries based on payment type
            if (invoice) {
                await this.createPaymentJournalEntries(
                    tx,
                    payment,
                    invoice,
                    data.amount,
                    isFullPayment,
                    data.createdById
                );
            }

            return payment;
        });
    }

    private async createPaymentJournalEntries(
        tx: any,
        payment: any,
        invoice: any,
        paymentAmount: number,
        isFullPayment: boolean,
        userId: string
    ) {
        // Get necessary accounts
        const cashAccount = await tx.account.findFirst({
            where: { code: '1010', type: 'ASSET' }, // Cash/Bank account
        });

        const accountsReceivableAccount = await tx.account.findFirst({
            where: { code: '1200', type: 'ASSET' }, // Accounts Receivable
        });

        const revenueAccount = await tx.account.findFirst({
            where: { code: '4000', type: 'REVENUE' }, // Revenue/Sales
        });

        if (!cashAccount || !accountsReceivableAccount || !revenueAccount) {
            throw new Error('Required accounts not found. Please ensure Cash (1010), A/R (1200), and Revenue (4000) accounts exist.');
        }

        // Generate entry number
        const entryCount = await tx.journalEntry.count();
        const entryNumber = `JE-${String(entryCount + 1).padStart(5, '0')}`;

        if (isFullPayment) {
            // Full Payment: Single journal entry
            // Debit: Cash, Credit: Revenue
            await tx.journalEntry.create({
                data: {
                    entryNumber,
                    date: new Date(payment.date),
                    description: `Payment received for Invoice ${invoice.invoiceNumber} - Full Payment`,
                    reference: payment.reference || payment.paymentNumber,
                    status: 'POSTED',
                    createdById: userId,
                    lines: {
                        create: [
                            {
                                accountId: cashAccount.id,
                                description: `Cash received from ${invoice.customer?.name || 'customer'}`,
                                debit: paymentAmount,
                                credit: 0,
                            },
                            {
                                accountId: revenueAccount.id,
                                description: `Revenue from Invoice ${invoice.invoiceNumber}`,
                                debit: 0,
                                credit: paymentAmount,
                            },
                        ],
                    },
                },
            });
        } else {
            // Partial Payment: Two journal entries

            // Entry 1: Payment received (Cash -> A/R)
            const paymentEntryNumber = `JE-${String(entryCount + 1).padStart(5, '0')}`;
            await tx.journalEntry.create({
                data: {
                    entryNumber: paymentEntryNumber,
                    date: new Date(payment.date),
                    description: `Payment received for Invoice ${invoice.invoiceNumber} - Partial Payment`,
                    reference: payment.reference || payment.paymentNumber,
                    status: 'POSTED',
                    createdById: userId,
                    lines: {
                        create: [
                            {
                                accountId: cashAccount.id,
                                description: `Cash received from ${invoice.customer?.name || 'customer'}`,
                                debit: paymentAmount,
                                credit: 0,
                            },
                            {
                                accountId: accountsReceivableAccount.id,
                                description: `Partial payment for Invoice ${invoice.invoiceNumber}`,
                                debit: 0,
                                credit: paymentAmount,
                            },
                        ],
                    },
                },
            });

            // Entry 2: Accounts Receivable recognition (A/R -> Revenue)
            const arEntryNumber = `JE-${String(entryCount + 2).padStart(5, '0')}`;
            await tx.journalEntry.create({
                data: {
                    entryNumber: arEntryNumber,
                    date: new Date(invoice.date),
                    description: `Accounts Receivable for Invoice ${invoice.invoiceNumber}`,
                    reference: invoice.invoiceNumber,
                    status: 'POSTED',
                    createdById: userId,
                    lines: {
                        create: [
                            {
                                accountId: accountsReceivableAccount.id,
                                description: `A/R from ${invoice.customer?.name || 'customer'}`,
                                debit: invoice.total,
                                credit: 0,
                            },
                            {
                                accountId: revenueAccount.id,
                                description: `Revenue from Invoice ${invoice.invoiceNumber}`,
                                debit: 0,
                                credit: invoice.total,
                            },
                        ],
                    },
                },
            });
        }
    }

    async updatePayment(id: string, data: any) {
        const payment = await this.repository.findById(id);
        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        return await this.repository.update(id, data);
    }

    async deletePayment(id: string) {
        const payment = await this.repository.findById(id);
        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        return await this.repository.delete(id);
    }
}
