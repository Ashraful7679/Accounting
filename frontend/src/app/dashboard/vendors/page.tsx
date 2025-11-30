'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Mail, Phone, Building2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';

export default function VendorsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: async () => {
            const response = await api.get('/vendors');
            return response.data.data;
        },
    });

    return (
        <div className="space-y-6">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Vendors</h1>
                    <p className="text-slate-400">Manage your supplier relationships</p>
                </div>
                <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
                    Add Vendor
                </Button>
            </motion.div>

            {/* Search and filters */}
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
                                placeholder="Search vendors..."
                                className="input pl-11"
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Vendors table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>All Vendors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={8} />
                        ) : data?.vendors?.length > 0 ? (
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
                                        {data.vendors.map((vendor: any, index: number) => (
                                            <motion.tr
                                                key={vendor.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="font-mono text-blue-400">{vendor.code}</td>
                                                <td className="font-medium">{vendor.name}</td>
                                                <td>
                                                    <div className="space-y-1">
                                                        {vendor.email && (
                                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                                <Mail className="w-3 h-3" />
                                                                {vendor.email}
                                                            </div>
                                                        )}
                                                        {vendor.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                                <Phone className="w-3 h-3" />
                                                                {vendor.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="font-mono">
                                                    ${vendor.currentBalance?.toLocaleString() || '0.00'}
                                                </td>
                                                <td>
                                                    <Badge variant={vendor.isActive ? 'success' : 'error'}>
                                                        {vendor.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
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
                                    <Building2 className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No vendors yet</h3>
                                <p className="text-slate-400 mb-4">Get started by adding your first vendor</p>
                                <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
                                    Add Vendor
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
