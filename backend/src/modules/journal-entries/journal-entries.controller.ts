import { FastifyRequest, FastifyReply } from 'fastify';
import { JournalEntriesService } from './journal-entries.service';
import { createAuditLog } from '../../middleware/auditLog';

export class JournalEntriesController {
    private service: JournalEntriesService;

    constructor() {
        this.service = new JournalEntriesService();
    }

    async getEntries(request: FastifyRequest, reply: FastifyReply) {
        const { page = 1, limit = 50, search } = request.query as any;
        const result = await this.service.getEntries(
            parseInt(page),
            parseInt(limit),
            search
        );

        return reply.send({
            success: true,
            data: result,
        });
    }

    async getEntryById(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const entry = await this.service.getEntryById(id);

        return reply.send({
            success: true,
            data: entry,
        });
    }

    async createEntry(request: FastifyRequest, reply: FastifyReply) {
        const data = request.body as any;
        const entry = await this.service.createEntry(data);

        await createAuditLog(
            request,
            'CREATE' as any,
            'JournalEntry',
            entry.id,
            undefined,
            entry
        );

        return reply.status(201).send({
            success: true,
            data: entry,
            message: 'Journal entry created successfully',
        });
    }

    async postEntry(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const entry = await this.service.postEntry(id);

        await createAuditLog(
            request,
            'UPDATE' as any,
            'JournalEntry',
            entry.id,
            undefined,
            entry
        );

        return reply.send({
            success: true,
            data: entry,
            message: 'Journal entry posted successfully',
        });
    }

    async updateEntry(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const data = request.body as any;

        const oldEntry = await this.service.getEntryById(id);
        const entry = await this.service.updateEntry(id, data);

        await createAuditLog(
            request,
            'UPDATE' as any,
            'JournalEntry',
            entry.id,
            oldEntry,
            entry
        );

        return reply.send({
            success: true,
            data: entry,
            message: 'Journal entry updated successfully',
        });
    }

    async deleteEntry(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string };
        const entry = await this.service.deleteEntry(id);

        await createAuditLog(
            request,
            'DELETE' as any,
            'JournalEntry',
            id,
            entry,
            undefined
        );

        return reply.send({
            success: true,
            message: 'Journal entry deleted successfully',
        });
    }
}
