'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { showSuccess, showError } from '@/lib/toast';
import { Modal } from '@/components/ui/Modal';

interface InvoiceItem {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxCodeId?: string;
}

interface Payment {
    paymentMethod: string;
    amount: number;
    reference?: string;
}

export default function InvoicesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingInvoice, setViewingInvoice] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([
        { description: '', quantity: 1, unitPrice: 0 },
    ]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [discount, setDiscount] = useState(0);
    const [isPercentage, setIsPercentage] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['invoices', searchTerm],
        queryFn: async () => {
            const response = await api.get('/invoices', {
                params: { search: searchTerm || undefined },
            });
            return response.data.data;
        },
    });

    const { data: customersData } = useQuery({
        queryKey: ['customers-all'],
        queryFn: async () => {
            const response = await api.get('/customers', { params: { limit: 1000 } });
            return response.data.data;
        },
    });

    const { data: productsData } = useQuery({
        queryKey: ['products-all'],
        queryFn: async () => {
            const response = await api.get('/products', { params: { limit: 1000 } });
            return response.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (invoiceData: any) => {
            const response = await api.post('/invoices', invoiceData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setIsModalOpen(false);
            resetForm();
            showSuccess('Invoice created successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to create invoice');
        },
    });

    const verifyMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/invoices/${id}/verify`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            showSuccess('Invoice verified successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to verify invoice');
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/invoices/${id}/approve`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            showSuccess('Invoice approved and journal entry created!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to approve invoice');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/invoices/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            showSuccess('Invoice deleted successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to delete invoice');
        },
    });

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addPayment = () => {
        setPayments([...payments, { paymentMethod: 'CASH', amount: 0 }]);
    };

    const removePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const updatePayment = (index: number, field: keyof Payment, value: any) => {
        const newPayments = [...payments];
        newPayments[index] = { ...newPayments[index], [field]: value };
        setPayments(newPayments);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const calculateDiscountAmount = () => {
        const subtotal = calculateSubtotal();
        if (isPercentage) {
            return (subtotal * discount) / 100;
        }
        return discount;
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscountAmount();
    };

    const calculatePaidAmount = () => {
        return payments.reduce((sum, payment) => sum + payment.amount, 0);
    };

    const calculateDueAmount = () => {
        return calculateTotal() - calculatePaidAmount();
    };

    const resetForm = () => {
        setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
        setPayments([]);
        setDiscount(0);
        setIsPercentage(false);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const invoiceData = {
            customerId: formData.get('customerId'),
            date: new Date(formData.get('date') as string).toISOString(),
            dueDate: new Date(formData.get('dueDate') as string).toISOString(),
            reference: formData.get('reference'),
            notes: formData.get('notes'),
            items: items.filter(item => item.description),
            payments: payments.filter(payment => payment.amount > 0),
            discount: calculateDiscountAmount(),
        };

        createMutation.mutate(invoiceData);
    };

    const handleVerify = (id: string) => {
        if (confirm('Verify this invoice?')) {
            verifyMutation.mutate(id);
        }
    };

    const handleApprove = (id: string) => {
        if (confirm('Approve this invoice? This will create a journal entry.')) {
            approveMutation.mutate(id);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this invoice?')) {
            deleteMutation.mutate(id);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED':
            case 'PAID':
                return 'success';
            case 'VERIFIED':
                return 'info';
            case 'DRAFT':
                return 'warning';
            case 'CANCELLED':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Invoices</h1>
                    <p className="text-slate-400">Manage customer invoices and payments</p>
                </div>
                <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
                    Create Invoice
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                className="input pl-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                    <CardHeader>
                        <CardTitle>All Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={8} />
                        ) : data?.invoices?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Invoice #</th>
                                            <th>Customer</th>
                                            <th>Date</th>
                                            <th>Total</th>
                                            <th>Paid</th>
                                            <th>Due</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.invoices.map((invoice: any, index: number) => (
                                            <motion.tr
                                                key={invoice.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="font-mono text-blue-400">{invoice.invoiceNumber}</td>
                                                <td className="font-medium">{invoice.customer?.name}</td>
                                                <td>{format(new Date(invoice.date), 'MMM dd, yyyy')}</td>
                                                <td className="font-mono">${invoice.total?.toLocaleString()}</td>
                                                <td className="font-mono text-green-400">${invoice.paidAmount?.toLocaleString()}</td>
                                                <td className="font-mono text-orange-400">${invoice.balanceDue?.toLocaleString()}</td>
                                                <td>
                                                    <Badge variant={getStatusVariant(invoice.status)}>
                                                        {invoice.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setViewingInvoice(invoice)}
                                                            className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                                                            title="View Invoice"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {invoice.status === 'DRAFT' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleVerify(invoice.id)}
                                                                    className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors"
                                                                    title="Verify"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(invoice.id)}
                                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {invoice.status === 'VERIFIED' && (
                                                            <button
                                                                onClick={() => handleApprove(invoice.id)}
                                                                className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors"
                                                                title="Approve & Post"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-slate-400">No invoices found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Create Invoice Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title="Create Invoice"
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Customer & Reference */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Customer *</label>
                            <select name="customerId" required className="input">
                                <option value="">Select Customer</option>
                                {customersData?.customers?.map((customer: any) => (
                                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Reference</label>
                            <input type="text" name="reference" className="input" placeholder="PO #, Invoice Ref, etc." />
                        </div>
                    </div>

                    {/* Date & Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Invoice Date *</label>
                            <input
                                type="date"
                                name="date"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Due Date *</label>
                            <input
                                type="date"
                                name="dueDate"
                                required
                                defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                className="input"
                            />
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-300">Items *</label>
                            <Button type="button" variant="secondary" size="md" icon={<Plus className="w-6 h-6" />} onClick={addItem}>
                                Add Item
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-3">
                                        <select
                                            value={item.productId || ''}
                                            onChange={(e) => {
                                                const productId = e.target.value;
                                                const newItems = [...items];

                                                if (productId) {
                                                    const product = productsData?.products?.find((p: any) => p.id === productId);
                                                    if (product) {
                                                        newItems[index] = {
                                                            ...newItems[index],
                                                            productId: productId,
                                                            description: product.name,
                                                            unitPrice: product.salePrice || 0,
                                                        };
                                                    }
                                                } else {
                                                    newItems[index] = {
                                                        ...newItems[index],
                                                        productId: '',
                                                    };
                                                }

                                                setItems(newItems);
                                            }}
                                            className="input text-sm"
                                        >
                                            <option value="">Select Product</option>
                                            {productsData?.products?.map((product: any) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            type="text"
                                            placeholder="Description *"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            className="input text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="input text-sm text-center"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="input text-sm"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center justify-between px-2">
                                        <span className="text-sm text-slate-300 font-mono font-semibold">
                                            ${(item.quantity * item.unitPrice).toFixed(2)}
                                        </span>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="p-1 rounded hover:bg-red-500/10 text-red-400"
                                                title="Remove"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Discount */}
                    <div className="bg-slate-800/30 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-slate-300 min-w-[80px]">Discount:</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={discount}
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                className="input flex-1"
                                min="0"
                            />
                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPercentage}
                                    onChange={(e) => setIsPercentage(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                />
                                <span>Percentage (%)</span>
                            </label>
                            <div className="min-w-[120px] text-right">
                                <span className="text-sm text-slate-400">Discount Amount:</span>
                                <div className="text-lg font-mono font-semibold text-red-400">
                                    -${calculateDiscountAmount().toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payments */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-300">Payments</label>
                            <Button type="button" variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addPayment}>
                                Add Payment
                            </Button>
                        </div>
                        {payments.length > 0 && (
                            <div className="space-y-3">
                                {payments.map((payment, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <select
                                            value={payment.paymentMethod}
                                            onChange={(e) => updatePayment(index, 'paymentMethod', e.target.value)}
                                            className="input w-20"
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="BANK">Bank Transfer</option>
                                            <option value="ONLINE">Online Payment</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={payment.amount}
                                            onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                                            className="input flex-2"
                                            min="0"
                                            step="1"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Reference"
                                            value={payment.reference || ''}
                                            onChange={(e) => updatePayment(index, 'reference', e.target.value)}
                                            className="input flex-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePayment(index)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Subtotal:</span>
                            <span className="text-slate-300 font-mono">${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        {calculateDiscountAmount() > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Discount:</span>
                                <span className="text-red-400 font-mono">-${calculateDiscountAmount().toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
                            <span className="text-white font-medium">Total Amount:</span>
                            <span className="text-white font-mono font-semibold">${calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Paid Amount:</span>
                            <span className="text-green-400 font-mono font-semibold">${calculatePaidAmount().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base border-t border-slate-700 pt-2">
                            <span className="text-white font-medium">Due Amount:</span>
                            <span className="text-orange-400 font-mono font-bold">${calculateDueAmount().toFixed(2)}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                        <textarea name="notes" className="input" rows={3} placeholder="Additional notes..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                            Create Invoice
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Invoice Modal */}
            {viewingInvoice && (
                <Modal
                    isOpen={!!viewingInvoice}
                    onClose={() => setViewingInvoice(null)}
                    title={`Invoice ${viewingInvoice.invoiceNumber}`}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg">
                            <div>
                                <p className="text-sm text-slate-400">Customer</p>
                                <p className="text-white font-medium">{viewingInvoice.customer?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Status</p>
                                <Badge variant={getStatusVariant(viewingInvoice.status)}>{viewingInvoice.status}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Date</p>
                                <p className="text-white">{format(new Date(viewingInvoice.date), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Due Date</p>
                                <p className="text-white">{format(new Date(viewingInvoice.dueDate), 'MMM dd, yyyy')}</p>
                            </div>
                        </div>

                        {viewingInvoice.items?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-2">Items</h4>
                                <div className="space-y-2">
                                    {viewingInvoice.items.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between text-sm p-2 bg-slate-800/30 rounded">
                                            <span className="text-white">{item.description}</span>
                                            <span className="text-slate-400">{item.quantity} × ${item.unitPrice} = ${item.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {viewingInvoice.payments?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-2">Payments</h4>
                                <div className="space-y-2">
                                    {viewingInvoice.payments.map((payment: any, index: number) => (
                                        <div key={index} className="flex justify-between text-sm p-2 bg-slate-800/30 rounded">
                                            <span className="text-white">{payment.paymentMethod}</span>
                                            <span className="text-green-400 font-mono">${payment.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total:</span>
                                <span className="text-white font-mono font-semibold">${viewingInvoice.total?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Paid:</span>
                                <span className="text-green-400 font-mono">${viewingInvoice.paidAmount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-700 pt-2">
                                <span className="text-white font-medium">Due:</span>
                                <span className="text-orange-400 font-mono font-bold">${viewingInvoice.balanceDue?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={() => setViewingInvoice(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
