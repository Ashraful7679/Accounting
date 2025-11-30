import { z } from 'zod';

const invoiceItemSchema = z.object({
    productId: z.string().uuid().nullable().optional().transform(val => val || undefined),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    taxCodeId: z.string().uuid().optional(),
    amount: z.number().optional(), // Frontend sends this but backend recalculates
});

export const createInvoiceSchema = z.object({
    customerId: z.string().uuid('Invalid customer ID'),
    date: z.string().datetime(),
    dueDate: z.string().datetime(),
    reference: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
}).passthrough(); // Allow extra fields like subtotal, taxAmount, total, createdById

export const updateInvoiceSchema = z.object({
    date: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
