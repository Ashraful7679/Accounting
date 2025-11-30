'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { showSuccess, showError } from '@/lib/toast';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';

export default function AccountsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['accounts', searchTerm],
        queryFn: async () => {
            const response = await api.get('/accounts', {
                params: { search: searchTerm || undefined, limit: 1000 },
            });
            return response.data.data;
        },
    });

    const { data: accountTypesData } = useQuery({
        queryKey: ['account-types'],
        queryFn: async () => {
            const response = await api.get('/accounts/types');
            return response.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (accountData: any) => {
            const response = await api.post('/accounts', accountData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setIsModalOpen(false);
            setEditingAccount(null);
            showSuccess('Account created successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to create account');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.put(`/accounts/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setIsModalOpen(false);
            setEditingAccount(null);
            showSuccess('Account updated successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to update account');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/accounts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            showSuccess('Account deleted successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to delete account');
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const accountData = {
            code: formData.get('code'),
            name: formData.get('name'),
            description: formData.get('description'),
            accountTypeId: formData.get('accountTypeId'),
            parentId: formData.get('parentId') || null,
            currentBalance: parseFloat(formData.get('currentBalance') as string) || 0,
        };

        if (editingAccount) {
            updateMutation.mutate({ id: editingAccount.id, data: accountData });
        } else {
            createMutation.mutate(accountData);
        }
    };

    const handleEdit = (account: any) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this account?')) {
            deleteMutation.mutate(id);
        }
    };

    const getAccountTypeColor = (type: string) => {
        switch (type.toUpperCase()) {
            case 'ASSET':
                return 'text-blue-400';
            case 'LIABILITY':
                return 'text-red-400';
            case 'EQUITY':
                return 'text-purple-400';
            case 'REVENUE':
                return 'text-green-400';
            case 'EXPENSE':
                return 'text-amber-400';
            default:
                return 'text-slate-400';
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
                    <h1 className="text-3xl font-bold text-white mb-2">Chart of Accounts</h1>
                    <p className="text-slate-400">Manage your accounting structure</p>
                </div>
                <Button
                    variant="primary"
                    icon={<Plus className="w-5 h-5" />}
                    onClick={() => {
                        setEditingAccount(null);
                        setIsModalOpen(true);
                    }}
                >
                    Add Account
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
                                placeholder="Search accounts..."
                                className="input pl-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Accounts table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>All Accounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={10} />
                        ) : data?.accounts?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.accounts.map((account: any, index: number) => (
                                            <motion.tr
                                                key={account.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <td className="font-mono text-blue-400">{account.code}</td>
                                                <td className="font-medium">{account.name}</td>
                                                <td>
                                                    <span className={`font-medium ${getAccountTypeColor(account.accountType?.type)}`}>
                                                        {account.accountType?.type}
                                                    </span>
                                                </td>
                                                <td className="font-mono">
                                                    ${(() => {
                                                        const balance = account.currentBalance || 0;
                                                        // Revenue and Liability accounts have credit normal balance
                                                        // Display them as positive for better UX
                                                        const type = account.accountType?.type?.toUpperCase();
                                                        const displayBalance = (type === 'REVENUE' || type === 'LIABILITY' || type === 'EQUITY')
                                                            ? Math.abs(balance)
                                                            : balance;
                                                        return displayBalance.toLocaleString();
                                                    })()}
                                                </td>
                                                <td>
                                                    <Badge variant={account.isActive ? 'success' : 'error'}>
                                                        {account.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(account)}
                                                            className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(account.id)}
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
                                    <FolderTree className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No accounts yet</h3>
                                <p className="text-slate-400 mb-4">Create your first account</p>
                                <Button
                                    variant="primary"
                                    icon={<Plus className="w-5 h-5" />}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    Add Account
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Account Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAccount(null);
                }}
                title={editingAccount ? 'Edit Account' : 'Add New Account'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Account Code *
                            </label>
                            <input
                                type="text"
                                name="code"
                                required
                                defaultValue={editingAccount?.code}
                                className="input"
                                placeholder="1000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Account Type *
                            </label>
                            <select
                                name="accountTypeId"
                                required
                                defaultValue={editingAccount?.accountTypeId}
                                className="input"
                            >
                                <option value="">Select Type</option>
                                {accountTypesData?.accountTypes?.map((type: any) => (
                                    <option key={type.id} value={type.id}>
                                        {type.type} - {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Account Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                defaultValue={editingAccount?.name}
                                className="input"
                                placeholder="Cash in Hand"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                defaultValue={editingAccount?.description}
                                className="input"
                                rows={3}
                                placeholder="Account description"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Parent Account
                            </label>
                            <select
                                name="parentId"
                                defaultValue={editingAccount?.parentId || ''}
                                className="input"
                            >
                                <option value="">None (Top Level)</option>
                                {data?.accounts?.map((account: any) => (
                                    <option key={account.id} value={account.id}>
                                        {account.code} - {account.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {!editingAccount && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Opening Balance
                                </label>
                                <input
                                    type="number"
                                    name="currentBalance"
                                    step="0.01"
                                    defaultValue={0}
                                    className="input"
                                    placeholder="0.00"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingAccount(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingAccount ? 'Update Account' : 'Create Account'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
