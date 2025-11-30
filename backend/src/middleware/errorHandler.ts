import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors';

export const errorHandler = async (
    error: Error,
    request: FastifyRequest,
    reply: FastifyReply
) => {
    // Log error
    request.log.error(error);

    // Handle operational errors
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            success: false,
            error: {
                message: error.message,
                statusCode: error.statusCode,
            },
        });
    }

    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;

        if (prismaError.code === 'P2002') {
            return reply.status(409).send({
                success: false,
                error: {
                    message: 'A record with this value already exists',
                    statusCode: 409,
                },
            });
        }

        if (prismaError.code === 'P2025') {
            return reply.status(404).send({
                success: false,
                error: {
                    message: 'Record not found',
                    statusCode: 404,
                },
            });
        }
    }

    // Handle validation errors
    if (error.name === 'ZodError') {
        return reply.status(400).send({
            success: false,
            error: {
                message: 'Validation error',
                statusCode: 400,
                details: error,
            },
        });
    }

    // Handle unknown errors
    return reply.status(500).send({
        success: false,
        error: {
            message: process.env.NODE_ENV === 'development'
                ? error.message
                : 'Internal server error',
            statusCode: 500,
        },
    });
};
