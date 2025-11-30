import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { accountsRoutes } from './modules/accounts/accounts.routes';
import { invoicesRoutes } from './modules/invoices/invoices.routes';
import { customersRoutes } from './modules/customers/customers.routes';
import { vendorsRoutes } from './modules/vendors/vendors.routes';
import { productsRoutes } from './modules/products/products.routes';
import { paymentsReceivedRoutes } from './modules/payments-received/payments-received.routes';
import { journalEntriesRoutes } from './modules/journal-entries/journal-entries.routes';
import { ledgerRoutes } from './modules/ledger/ledger.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { purchasesRoutes } from './modules/purchases/purchases.routes';
import prisma from './config/database';

const fastify = Fastify({
    logger: {
        level: config.nodeEnv === 'development' ? 'info' : 'error',
    },
});

// Register plugins
fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
});

fastify.register(jwt, {
    secret: config.jwt.secret,
    sign: {
        expiresIn: config.jwt.expiresIn,
    },
});

// Error handler
fastify.setErrorHandler(errorHandler);

// Health check
fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(accountsRoutes, { prefix: '/api/accounts' });
fastify.register(invoicesRoutes, { prefix: '/api/invoices' });
fastify.register(customersRoutes, { prefix: '/api/customers' });
fastify.register(vendorsRoutes, { prefix: '/api/vendors' });
fastify.register(productsRoutes, { prefix: '/api/products' });
fastify.register(paymentsReceivedRoutes, { prefix: '/api/payments-received' });
fastify.register(journalEntriesRoutes, { prefix: '/api/journal-entries' });
fastify.register(ledgerRoutes, { prefix: '/api/ledger' });
fastify.register(reportsRoutes, { prefix: '/api' });
fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });
fastify.register(purchasesRoutes, { prefix: '/api/purchases' });

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    await fastify.close();
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
const start = async () => {
    try {
        await fastify.listen({
            port: PORT,
            host: '0.0.0.0',
        });

        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start(); // only this

