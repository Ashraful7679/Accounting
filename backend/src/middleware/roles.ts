import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database';

// Check if user has a specific role
export const hasRole = async (userId: string, roleName: string): Promise<boolean> => {
    console.log(`Checking role ${roleName} for user ${userId}`);
    const userRole = await prisma.userRole.findFirst({
        where: {
            userId,
            role: {
                name: roleName,
            },
        },
    });
    console.log(`Role ${roleName} found: ${!!userRole}`);
    return !!userRole;
};

// Check if user is admin
export const isAdmin = async (userId: string): Promise<boolean> => {
    return await hasRole(userId, 'Admin');
};

// Check if user is admin or manager
export const isAdminOrManager = async (userId: string): Promise<boolean> => {
    const isAdminUser = await hasRole(userId, 'Admin');
    const isManagerUser = await hasRole(userId, 'Manager');
    return isAdminUser || isManagerUser;
};

// Middleware to require admin role
export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.id;
    if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }

    const admin = await isAdmin(userId);
    if (!admin) {
        return reply.status(403).send({ error: 'Admin access required' });
    }
};

// Middleware to require admin or manager role
export const requireAdminOrManager = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.id;
    if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }

    const hasPermission = await isAdminOrManager(userId);
    if (!hasPermission) {
        return reply.status(403).send({ error: 'Admin or Manager access required' });
    }
};
