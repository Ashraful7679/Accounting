import { JournalEntriesRepository } from './journal-entries.repository';
import { NotFoundError, ValidationError } from '../../utils/errors';
import prisma from '../../config/database';

export class JournalEntriesService {
    private repository: JournalEntriesRepository;

    constructor() {
        this.repository = new JournalEntriesRepository();
    }

    async getEntries(page: number = 1, limit: number = 50, search?: string) {
        const skip = (page - 1) * limit;
        const { entries, total } = await this.repository.findAll(skip, limit, search);

        return {
            entries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getEntryById(id: string) {
        const entry = await this.repository.findById(id);
        if (!entry) {
            throw new NotFoundError('Journal entry not found');
        }
        return entry;
    }

    async createEntry(data: any) {
        if (!data.entryNumber) {
            data.entryNumber = await this.repository.getNextNumber();
        }

        // Validate debit/credit balance
        const totalDebit = data.lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
        const totalCredit = data.lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new ValidationError('Debits must equal credits');
        }

        return await this.repository.create(data);
    }

    async postEntry(id: string) {
        const entry = await this.repository.findById(id);
        if (!entry) {
            throw new NotFoundError('Journal entry not found');
        }

        if (entry.status !== 'DRAFT') {
            throw new ValidationError('Only draft entries can be posted');
        }

        // Post to ledger and update account balances in transaction
        return await prisma.$transaction(async (tx) => {
            // Update entry status
            const updatedEntry = await tx.journalEntry.update({
                where: { id },
                data: { status: 'POSTED' },
            });

            // Create ledger entries
            for (const line of entry.lines) {
                await tx.ledger.create({
                    data: {
                        accountId: line.accountId,
                        date: entry.date,
                        description: entry.description,
                        reference: entry.entryNumber,
                        debit: line.debit,
                        credit: line.credit,
                        balance: 0, // Will be calculated
                        journalEntryId: entry.id,
                    },
                });

                // Update account balance
                const account = await tx.account.findUnique({ where: { id: line.accountId } });
                if (account) {
                    const balanceChange = line.debit - line.credit;
                    await tx.account.update({
                        where: { id: line.accountId },
                        data: {
                            currentBalance: account.currentBalance + balanceChange,
                        },
                    });
                }
            }

            return updatedEntry;
        });
    }

    async updateEntry(id: string, data: any) {
        const entry = await this.repository.findById(id);
        if (!entry) {
            throw new NotFoundError('Journal entry not found');
        }

        if (entry.status === 'POSTED') {
            throw new ValidationError('Cannot update posted entries');
        }

        return await this.repository.update(id, data);
    }

    async deleteEntry(id: string) {
        const entry = await this.repository.findById(id);
        if (!entry) {
            throw new NotFoundError('Journal entry not found');
        }

        if (entry.status === 'POSTED') {
            throw new ValidationError('Cannot delete posted entries');
        }

        return await this.repository.delete(id);
    }
}
