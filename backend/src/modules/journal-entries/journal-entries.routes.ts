import { FastifyInstance } from 'fastify';
import { JournalEntriesController } from './journal-entries.controller';
import { authenticate } from '../../middleware/auth';

export const journalEntriesRoutes = async (fastify: FastifyInstance) => {
    const controller = new JournalEntriesController();

    fastify.addHook('preHandler', authenticate);

    fastify.get('/', controller.getEntries.bind(controller));
    fastify.get('/:id', controller.getEntryById.bind(controller));
    fastify.post('/', controller.createEntry.bind(controller));
    fastify.post('/:id/post', controller.postEntry.bind(controller));
    fastify.put('/:id', controller.updateEntry.bind(controller));
    fastify.delete('/:id', controller.deleteEntry.bind(controller));
};
