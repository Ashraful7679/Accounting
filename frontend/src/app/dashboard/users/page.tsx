'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Users, Shield } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { showSuccess, showError } from '@/lib/toast';
import { Modal } from '@/components/ui/Modal';

export default function UsersPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['users', searchTerm],
        queryFn: async () => {
            const response = await api.get('/auth/users', {
                params: { search: searchTerm || undefined },
            });
            return response.data.data;
        },
    });

    const { data: rolesData } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await api.get('/auth/roles');
            return response.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (userData: any) => {
            const response = await api.post('/auth/register', userData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsModalOpen(false);
            setEditingUser(null);
            showSuccess('User created successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to create user');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.put(`/auth/users/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsModalOpen(false);
            setEditingUser(null);
            showSuccess('User updated successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to update user');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/auth/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccess('User deleted successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to delete user');
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            roleIds: [formData.get('roleId')],
        };

        if (editingUser) {
            const updateData: any = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                roleIds: [formData.get('roleId')],
            };
            if (formData.get('password')) {
                updateData.password = formData.get('password');
            }
            updateMutation.mutate({ id: editingUser.id, data: updateData });
        } else {
            createMutation.mutate(userData);
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            deleteMutation.mutate(id);
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
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-slate-400">Manage users and their roles</p>
                </div>
                <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
                    Add User
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
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
                        <CardTitle>All Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={8} />
                        ) : data?.users?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Roles</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.users.map((user: any, index: number) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="font-medium">{user.name}</td>
                                                <td className="text-slate-400">{user.email}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        {user.roles?.map((role: string) => (
                                                            <Badge key={role} variant="info">{role}</Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge variant={user.isActive ? 'success' : 'error'}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
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
                                    <Users className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No users yet</h3>
                                <p className="text-slate-400 mb-4">Create your first user</p>
                                <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
                                    Add User
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
                title={editingUser ? 'Edit User' : 'Add New User'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">First Name *</label>
                            <input type="text" name="firstName" required defaultValue={editingUser?.firstName} className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Last Name *</label>
                            <input type="text" name="lastName" required defaultValue={editingUser?.lastName} className="input" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                        <input type="email" name="email" required defaultValue={editingUser?.email} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Password {editingUser ? '(leave blank to keep current)' : '*'}
                        </label>
                        <input type="password" name="password" required={!editingUser} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Role *</label>
                        <select name="roleId" required defaultValue={editingUser?.roles?.[0]} className="input">
                            <option value="">Select Role</option>
                            {rolesData?.roles?.map((role: any) => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setEditingUser(null); }}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
                            {editingUser ? 'Update User' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
