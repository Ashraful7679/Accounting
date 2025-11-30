'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { showSuccess, showError } from '@/lib/toast';
import { Modal } from '@/components/ui/Modal';

export default function PaymentsReceivedPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingPayment, setViewingPayment] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['payments-received', searchTerm],
        queryFn: async () => {
            const response = await api.get('/payments-received', {
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

    // Fetch unpaid invoices for selected customer
    const { data: unpaidInvoicesData } = useQuery({
        queryKey: ['unpaid-invoices', selectedCustomer],
        queryFn: async () => {
            if (!selectedCustomer) return { invoices: [] };
            const response = await api.get('/invoices', {
                params: {
                    customerId: selectedCustomer,
                    status: 'APPROVED,PARTIALLY_PAID',
                    limit: 1000,
                },
            });
            return response.data.data;
        },
        enabled: !!selectedCustomer,
    });

    const createMutation = useMutation({
        mutationFn: async (paymentData: any) => {
            const response = await api.post('/payments-received', paymentData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments-received'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            setIsModalOpen(false);
            resetForm();
            showSuccess('Payment recorded successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to record payment');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/payments-received/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments-received'] });
            showSuccess('Payment deleted successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to delete payment');
        },
    });

    const resetForm = () => {
        setSelectedCustomer('');
        setSelectedInvoice('');
        setPaymentAmount('');
    };

    // Auto-fill amount when invoice is selected
    useEffect(() => {
        if (selectedInvoice && unpaidInvoicesData?.invoices) {
            const invoice = unpaidInvoicesData.invoices.find((inv: any) => inv.id === selectedInvoice);
            if (invoice) {
                setPaymentAmount(invoice.balanceDue?.toString() || '0');
            }
        }
    }, [selectedInvoice, unpaidInvoicesData]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const paymentData = {
            customerId: selectedCustomer,
            invoiceId: selectedInvoice || null,
            date: formData.get('date'),
            amount: parseFloat(paymentAmount),
            paymentMethod: formData.get('paymentMethod'),
            reference: formData.get('reference'),
            notes: formData.get('notes'),
        };

        createMutation.mutate(paymentData);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this payment?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        resetForm();
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Payments Received</h1>
                    <p className="text-slate-400">Track customer payments and receipts</p>
                </div>
                <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
                    Record Payment
                </Button>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
                    <CardContent className="p-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search payments..."
                                className="input pl-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Payments table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>All Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={8} />
                        ) : data?.payments?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Payment #</th>
                                            <th>Customer</th>
                                            <th>Invoice</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Method</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.payments.map((payment: any, index: number) => (
                                            <motion.tr
                                                key={payment.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="font-mono text-blue-400">{payment.paymentNumber}</td>
                                                <td className="font-medium">{payment.customer?.name || 'N/A'}</td>
                                                <td className="font-mono text-slate-400">
                                                    {payment.invoice?.invoiceNumber || '-'}
                                                </td>
                                                <td>{format(new Date(payment.date), 'MMM dd, yyyy')}</td>
                                                <td className="font-mono font-semibold text-green-400">
                                                    ${payment.amount?.toLocaleString() || '0.00'}
                                                </td>
                                                <td className="text-slate-400">{payment.paymentMethod || '-'}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setViewingPayment(payment)}
                                                            className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                                                            title="View Payment"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(payment.id)}
                                                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                            title="Delete Payment"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                                    <DollarSign className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No payments received yet</h3>
                                <p className="text-slate-400 mb-4">Record your first customer payment</p>
                                <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
                                    Record Payment
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Record Payment Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title="Record Payment"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Customer *
                            </label>
                            <select
                                value={selectedCustomer}
                                onChange={(e) => {
                                    setSelectedCustomer(e.target.value);
                                    setSelectedInvoice('');
                                    setPaymentAmount('');
                                }}
                                required
                                className="input"
                            >
                                <option value="">Select Customer</option>
                                {customersData?.customers?.map((customer: any) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Invoice (Optional)
                            </label>
                            <select
                                value={selectedInvoice}
                                onChange={(e) => setSelectedInvoice(e.target.value)}
                                className="input"
                                disabled={!selectedCustomer}
                            >
                                <option value="">No specific invoice</option>
                                {unpaidInvoicesData?.invoices?.map((invoice: any) => (
                                    <option key={invoice.id} value={invoice.id}>
                                        {invoice.invoiceNumber} - Balance Due: ${invoice.balanceDue?.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                            {selectedCustomer && unpaidInvoicesData?.invoices?.length === 0 && (
                                <p className="text-xs text-slate-400 mt-1">No unpaid invoices for this customer</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Date *
                            </label>
                            <input
                                type="date"
                                name="date"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Amount *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="input"
                                placeholder="0.00"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Payment Method *
                            </label>
                            <select name="paymentMethod" required className="input">
                                <option value="">Select Method</option>
                                <option value="CASH">Cash</option>
                                <option value="CHECK">Check</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CREDIT_CARD">Credit Card</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Reference
                            </label>
                            <input
                                type="text"
                                name="reference"
                                className="input"
                                placeholder="Check #, Transaction ID, etc."
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                className="input"
                                rows={3}
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={handleModalClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                            Record Payment
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Payment Modal */}
            {viewingPayment && (
                <Modal
                    isOpen={!!viewingPayment}
                    onClose={() => setViewingPayment(null)}
                    title={`Payment ${viewingPayment.paymentNumber}`}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg">
                            <div>
                                <p className="text-sm text-slate-400">Customer</p>
                                <p className="text-white font-medium">{viewingPayment.customer?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Invoice</p>
                                <p className="text-white">{viewingPayment.invoice?.invoiceNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Date</p>
                                <p className="text-white">{format(new Date(viewingPayment.date), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Amount</p>
                                <p className="text-green-400 font-mono font-semibold">${viewingPayment.amount?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Payment Method</p>
                                <p className="text-white">{viewingPayment.paymentMethod}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Reference</p>
                                <p className="text-white">{viewingPayment.reference || '-'}</p>
                            </div>
                            {viewingPayment.notes && (
                                <div className="col-span-2">
                                    <p className="text-sm text-slate-400">Notes</p>
                                    <p className="text-white">{viewingPayment.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={() => setViewingPayment(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
