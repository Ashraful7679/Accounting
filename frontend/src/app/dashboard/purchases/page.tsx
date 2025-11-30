'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Download, Check, X, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { showSuccess, showError } from '@/lib/toast';
import { Modal } from '@/components/ui/Modal';

export default function PurchasesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['purchases', searchTerm],
        queryFn: async () => {
            const response = await api.get('/purchases', {
                params: { search: searchTerm || undefined },
            });
            return response.data.data;
        },
    });

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors-all'],
        queryFn: async () => {
            const response = await api.get('/vendors', { params: { limit: 1000 } });
            return response.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (purchaseData: any) => {
            const response = await api.post('/purchases', purchaseData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            setIsModalOpen(false);
            showSuccess('Purchase created successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to create purchase');
        },
    });

    const getStatusVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED': return 'success';
            case 'VERIFIED': return 'info';
            case 'DRAFT': return 'warning';
            case 'REJECTED': return 'error';
            default: return 'default';
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
                    <h1 className="text-3xl font-bold text-white mb-2">Purchases & Bills</h1>
                    <p className="text-slate-400">Manage vendor bills and purchases</p>
                </div>
                <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
                    New Purchase
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search purchases..."
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
                        <CardTitle>All Purchases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={8} />
                        ) : data?.purchases?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Bill #</th>
                                            <th>Vendor</th>
                                            <th>Date</th>
                                            <th>Due Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.purchases.map((purchase: any, index: number) => (
                                            <motion.tr
                                                key={purchase.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="font-mono text-blue-400">{purchase.billNumber}</td>
                                                <td className="font-medium">{purchase.vendor?.name}</td>
                                                <td>{format(new Date(purchase.date), 'MMM dd, yyyy')}</td>
                                                <td>{format(new Date(purchase.dueDate), 'MMM dd, yyyy')}</td>
                                                <td className="font-mono">${purchase.total?.toLocaleString()}</td>
                                                <td>
                                                    <Badge variant={getStatusVariant(purchase.status)}>
                                                        {purchase.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors">
                                                            <Eye className="w-4 h-4" />
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
                                    <ShoppingCart className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No purchases yet</h3>
                                <p className="text-slate-400 mb-4">Create your first purchase order</p>
                                <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
                                    New Purchase
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Purchase"
                size="lg"
            >
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Vendor *</label>
                            <select name="vendorId" required className="input">
                                <option value="">Select Vendor</option>
                                {vendorsData?.vendors?.map((vendor: any) => (
                                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Bill Number *</label>
                            <input type="text" name="billNumber" required className="input" placeholder="BILL-001" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Date *</label>
                            <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Due Date *</label>
                            <input type="date" name="dueDate" required className="input" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                            <textarea name="description" className="input" rows={3} placeholder="Purchase description..." />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                            Create Purchase
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
