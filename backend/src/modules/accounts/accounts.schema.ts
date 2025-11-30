import { z } from 'zod';

export const createAccountSchema = z.object({
    code: z.string().min(1, 'Account code is required'),
    name: z.string().min(1, 'Account name is required'),
    accountTypeId: z.string().uuid('Invalid account type ID'),
    parentId: z.string().uuid().optional(),
    description: z.string().optional(),
    openingBalance: z.number().default(0),
});

export const updateAccountSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
