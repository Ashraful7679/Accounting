import { AccountsRepository } from './accounts.repository';
import { CreateAccountInput, UpdateAccountInput } from './accounts.schema';
import { ConflictError, NotFoundError } from '../../utils/errors';

export class AccountsService {
    private repository: AccountsRepository;

    constructor() {
        this.repository = new AccountsRepository();
    }

    async getAccounts(page: number = 1, limit: number = 50, search?: string) {
        const skip = (page - 1) * limit;
        const { accounts, total } = await this.repository.findAll(skip, limit, search);

        return {
            accounts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getAccountById(id: string) {
        const account = await this.repository.findById(id);
        if (!account) {
            throw new NotFoundError('Account not found');
        }
        return account;
    }

    async createAccount(data: CreateAccountInput) {
        // Check if account code already exists
        const existing = await this.repository.findByCode(data.code);
        if (existing) {
            throw new ConflictError('Account code already exists');
        }

        return await this.repository.create(data);
    }

    async updateAccount(id: string, data: UpdateAccountInput) {
        const account = await this.repository.findById(id);
        if (!account) {
            throw new NotFoundError('Account not found');
        }

        return await this.repository.update(id, data);
    }

    async deleteAccount(id: string) {
        const account = await this.repository.findById(id);
        if (!account) {
            throw new NotFoundError('Account not found');
        }

        // Check if account has transactions
        // In production, add check for ledger entries

        return await this.repository.delete(id);
    }

    async getAccountTree() {
        return await this.repository.getAccountTree();
    }

    async getAccountTypes() {
        return await this.repository.getAccountTypes();
    }
}
