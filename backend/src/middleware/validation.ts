import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
        try {
            request.body = schema.parse(request.body);
        } catch (error: any) {
            const errorMessage = error.errors
                ?.map((err: any) => `${err.path.join('.')}: ${err.message}`)
                .join(', ');
            throw new ValidationError(errorMessage || 'Validation failed');
        }
    };
};

export const validateQuery = (schema: ZodSchema) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
        try {
            request.query = schema.parse(request.query);
        } catch (error: any) {
            const errorMessage = error.errors
                ?.map((err: any) => `${err.path.join('.')}: ${err.message}`)
                .join(', ');
            throw new ValidationError(errorMessage || 'Validation failed');
        }
    };
};
