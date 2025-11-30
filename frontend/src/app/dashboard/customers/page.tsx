'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { showSuccess, showError } from '@/lib/toast';
import { Modal } from '@/components/ui/Modal';

export default function CustomersPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['customers', searchTerm],
        queryFn: async () => {
            const response = await api.get('/customers', {
                params: { search: searchTerm || undefined },
            });
            return response.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (customerData: any) => {
            const response = await api.post('/customers', customerData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsModalOpen(false);
            setEditingCustomer(null);
            showSuccess('Customer created successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to create customer');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.put(`/customers/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsModalOpen(false);
            setEditingCustomer(null);
            showSuccess('Customer updated successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to update customer');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/customers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            showSuccess('Customer deleted successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to delete customer');
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const customerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            country: formData.get('country'),
            creditLimit: parseFloat(formData.get('creditLimit') as string) || 0,
            openingBalance: parseFloat(formData.get('openingBalance') as string) || 0,
        };

        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer.id, data: customerData });
        } else {
            createMutation.mutate(customerData);
        }
    };

    const handleEdit = (customer: any) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            deleteMutation.mutate(id);
        }
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
                    <h1 className="text-3xl font-bold text-white mb-2">Customers</h1>
                    <p className="text-slate-400">Manage your customer relationships</p>
                </div>
                <Button
                    variant="primary"
                    icon={<Plus className="w-5 h-5" />}
                    onClick={() => {
                        setEditingCustomer(null);
                        setIsModalOpen(true);
                    }}
                >
                    Add Customer
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
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                className="input pl-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Customers table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>All Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={8} />
                        ) : data?.customers?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Name</th>
                                            <th>Contact</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.customers.map((customer: any, index: number) => (
                                            <motion.tr
                                                key={customer.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="font-mono text-blue-400">{customer.code}</td>
                                                <td className="font-medium">{customer.name}</td>
                                                <td>
                                                    <div className="space-y-1">
                                                        {customer.email && (
                                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                                <Mail className="w-3 h-3" />
                                                                {customer.email}
                                                            </div>
                                                        )}
                                                        {customer.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                                <Phone className="w-3 h-3" />
                                                                {customer.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="font-mono">
                                                    ${customer.currentBalance?.toLocaleString() || '0.00'}
                                                </td>
                                                <td>
                                                    <Badge variant={customer.isActive ? 'success' : 'error'}>
                                                        {customer.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(customer)}
                                                            className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(customer.id)}
                                                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
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
                                    <MapPin className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No customers yet</h3>
                                <p className="text-slate-400 mb-4">Get started by adding your first customer</p>
                                <Button
                                    variant="primary"
                                    icon={<Plus className="w-5 h-5" />}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    Add Customer
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Customer Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCustomer(null);
                }}
                title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Customer Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                defaultValue={editingCustomer?.name}
                                className="input"
                                placeholder="Acme Corporation"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                defaultValue={editingCustomer?.email}
                                className="input"
                                placeholder="contact@acme.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Phone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                defaultValue={editingCustomer?.phone}
                                className="input"
                                placeholder="+1234567890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                name="city"
                                defaultValue={editingCustomer?.city}
                                className="input"
                                placeholder="New York"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Country
                            </label>
                            <input
                                type="text"
                                name="country"
                                defaultValue={editingCustomer?.country}
                                className="input"
                                placeholder="USA"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Credit Limit
                            </label>
                            <input
                                type="number"
                                name="creditLimit"
                                step="0.01"
                                defaultValue={editingCustomer?.creditLimit || 0}
                                className="input"
                                placeholder="10000"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Address
                        </label>
                        <textarea
                            name="address"
                            defaultValue={editingCustomer?.address}
                            className="input"
                            rows={3}
                            placeholder="123 Main Street"
                        />
                    </div>
                    {!editingCustomer && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Opening Balance
                            </label>
                            <input
                                type="number"
                                name="openingBalance"
                                step="0.01"
                                defaultValue={0}
                                className="input"
                                placeholder="0.00"
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingCustomer(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingCustomer ? 'Update Customer' : 'Create Customer'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
