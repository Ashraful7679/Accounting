import { FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAuditLog = async (
    request: FastifyRequest,
    action: string, // 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'
    entity: string,
    entityId?: string,
    oldValue?: any,
    newValue?: any
) => {
    const userId = request.user?.id;

    if (!userId) return;

    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                oldValue: oldValue ? JSON.stringify(oldValue) : null,
                newValue: newValue ? JSON.stringify(newValue) : null,
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
            },
        });
    } catch (error) {
        // Don't fail the request if audit logging fails
        request.log.error(`Failed to create audit log: ${error}`);
    }
};
