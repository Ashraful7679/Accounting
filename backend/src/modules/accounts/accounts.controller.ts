import { FastifyRequest, FastifyReply } from 'fastify';
import { AccountsService } from './accounts.service';
import { CreateAccountInput, UpdateAccountInput } from './accounts.schema';
import { createAuditLog } from '../../middleware/auditLog';

export class AccountsController {
    private service: AccountsService;

    constructor() {
        this.service = new AccountsService();
    }

    async getAccounts(request: FastifyRequest, reply: FastifyReply) {
        const { page = 1, limit = 50, search } = request.query as any;
        const result = await this.service.getAccounts(
            parseInt(page),
            parseInt(limit),
            search
        );

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getAccountById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const account = await this.service.getAccountById(id);

        return reply.send({
            success: true,
            data: account,
        });
    }

    async createAccount(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as CreateAccountInput;
        const account = await this.service.createAccount(data);

        await createAuditLog(
            request,
            'CREATE',
            'Account',
            account.id,
            undefined,
            account
        );

        return reply.status(201).send({
            success: true,
            data: account,
            message: 'Account created successfully',
        });
    }

    async updateAccount(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as UpdateAccountInput;

        const oldAccount = await this.service.getAccountById(id);
        const account = await this.service.updateAccount(id, data);

        await createAuditLog(
            request,
            'UPDATE',
            'Account',
            account.id,
            oldAccount,
            account
        );

        return reply.send({
            success: true,
            data: account,
            message: 'Account updated successfully',
        });
    }

    async deleteAccount(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const account = await this.service.deleteAccount(id);

        await createAuditLog(
            request,
            'DELETE',
            'Account',
            id,
            account,
            undefined
        );

        return reply.send({
            success: true,
            message: 'Account deleted successfully',
        });
    }

    async getAccountTree(_request: FastifyRequest, reply: FastifyReply) {
        const tree = await this.service.getAccountTree();

        return reply.send({
            success: true,
            data: tree,
        });
    }

    async getAccountTypes(_request: FastifyRequest, reply: FastifyReply) {
        const types = await this.service.getAccountTypes();

        return reply.send({
            success: true,
            data: { accountTypes: types },
        });
    }
}
