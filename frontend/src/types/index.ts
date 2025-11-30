export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Account {
    id: string;
    code: string;
    name: string;
    accountTypeId: string;
    parentId?: string;
    description?: string;
    openingBalance: number;
    currentBalance: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    id: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    taxNumber?: string;
    creditLimit: number;
    openingBalance: number;
    currentBalance: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: string;
    code: string;
    name: string;
    description?: string;
    category?: string;
    unit: string;
    salePrice: number;
    purchasePrice: number;
    taxCodeId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceItem {
    id?: string;
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxCodeId?: string;
    taxAmount: number;
    total: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customer?: Customer;
    date: string;
    dueDate: string;
    reference?: string;
    notes?: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    paidAmount: number;
    balanceDue: number;
    status: 'DRAFT' | 'POSTED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
    items: InvoiceItem[];
    createdAt: string;
    updatedAt: string;
}

export interface JournalEntry {
    id: string;
    entryNumber: string;
    date: string;
    description: string;
    reference?: string;
    status: 'DRAFT' | 'POSTED' | 'REVERSED';
    lines: JournalEntryLine[];
    createdAt: string;
    updatedAt: string;
}

export interface JournalEntryLine {
    id?: string;
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface ApiError {
    success: false;
    error: {
        message: string;
        statusCode: number;
        details?: any;
    };
}
