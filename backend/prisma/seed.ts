import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...');

    // Create roles
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Administrator with full access',
        },
    });

    const accountantRole = await prisma.role.upsert({
        where: { name: 'Accountant' },
        update: {},
        create: {
            name: 'Accountant',
            description: 'Accountant with accounting access',
        },
    });

    const userRole = await prisma.role.upsert({
        where: { name: 'User' },
        update: {},
        create: {
            name: 'User',
            description: 'Regular user with limited access',
        },
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@accounting.com' },
        update: {},
        create: {
            email: 'admin@accounting.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            isActive: true,
        },
    });

    // Assign admin role
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: adminRole.id,
        },
    });

    // Create account types
    const assetType = await prisma.accountType.upsert({
        where: { name: 'Assets' },
        update: {},
        create: {
            name: 'Assets',
            type: 'ASSET',
            description: 'Assets owned by the company',
        },
    });

    const liabilityType = await prisma.accountType.upsert({
        where: { name: 'Liabilities' },
        update: {},
        create: {
            name: 'Liabilities',
            type: 'LIABILITY',
            description: 'Liabilities owed by the company',
        },
    });

    const equityType = await prisma.accountType.upsert({
        where: { name: 'Equity' },
        update: {},
        create: {
            name: 'Equity',
            type: 'EQUITY',
            description: 'Owner equity',
        },
    });

    const revenueType = await prisma.accountType.upsert({
        where: { name: 'Revenue' },
        update: {},
        create: {
            name: 'Revenue',
            type: 'REVENUE',
            description: 'Revenue and income',
        },
    });

    const expenseType = await prisma.accountType.upsert({
        where: { name: 'Expenses' },
        update: {},
        create: {
            name: 'Expenses',
            type: 'EXPENSE',
            description: 'Operating expenses',
        },
    });

    // Create sample chart of accounts
    const accounts = [
        // Assets
        { code: '1000', name: 'Cash', typeId: assetType.id },
        { code: '1100', name: 'Bank Account', typeId: assetType.id },
        { code: '1200', name: 'Accounts Receivable', typeId: assetType.id },
        { code: '1300', name: 'Tax Paid', typeId: assetType.id },
        { code: '1400', name: 'Inventory', typeId: assetType.id },
        { code: '1500', name: 'Fixed Assets', typeId: assetType.id },

        // Liabilities
        { code: '2000', name: 'Accounts Payable', typeId: liabilityType.id },
        { code: '2100', name: 'Tax Payable', typeId: liabilityType.id },
        { code: '2200', name: 'Loans Payable', typeId: liabilityType.id },

        // Equity
        { code: '3000', name: 'Owner Equity', typeId: equityType.id },
        { code: '3100', name: 'Retained Earnings', typeId: equityType.id },

        // Revenue
        { code: '4000', name: 'Sales Revenue', typeId: revenueType.id },
        { code: '4100', name: 'Service Revenue', typeId: revenueType.id },
        { code: '4200', name: 'Other Income', typeId: revenueType.id },

        // Expenses
        { code: '5000', name: 'Cost of Goods Sold', typeId: expenseType.id },
        { code: '5100', name: 'Salaries Expense', typeId: expenseType.id },
        { code: '5200', name: 'Rent Expense', typeId: expenseType.id },
        { code: '5300', name: 'Utilities Expense', typeId: expenseType.id },
        { code: '5400', name: 'Office Supplies', typeId: expenseType.id },
        { code: '5500', name: 'Depreciation Expense', typeId: expenseType.id },
    ];

    for (const account of accounts) {
        await prisma.account.upsert({
            where: { code: account.code },
            update: {},
            create: {
                code: account.code,
                name: account.name,
                accountTypeId: account.typeId,
                openingBalance: 0,
                currentBalance: 0,
                isActive: true,
            },
        });
    }

    // Create fiscal year
    const currentYear = new Date().getFullYear();
    await prisma.fiscalYear.upsert({
        where: { name: `FY ${currentYear}` },
        update: {},
        create: {
            name: `FY ${currentYear}`,
            startDate: new Date(`${currentYear}-01-01`),
            endDate: new Date(`${currentYear}-12-31`),
            isLocked: false,
            isClosed: false,
        },
    });

    // Create sample tax code
    await prisma.taxCode.upsert({
        where: { code: 'VAT' },
        update: {},
        create: {
            code: 'VAT',
            name: 'Value Added Tax',
            description: 'Standard VAT',
            isActive: true,
            taxRates: {
                create: {
                    rate: 15,
                    effectiveFrom: new Date('2024-01-01'),
                },
            },
        },
    });

    console.log('✅ Database seeded successfully!');
    console.log('📧 Admin email: admin@accounting.com');
    console.log('🔑 Admin password: admin123');
}

seed()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
