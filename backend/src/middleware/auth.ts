import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../utils/errors';

export const authenticate = async (
    request: FastifyRequest,
    _reply: FastifyReply
) => {
    try {
        await request.jwtVerify();
    } catch (error) {
        throw new UnauthorizedError('Invalid or expired token');
    }
};
