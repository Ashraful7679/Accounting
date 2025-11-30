'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { showSuccess, showError } from '@/lib/toast';

export default function ProductsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['products', searchTerm],
        queryFn: async () => {
            const response = await api.get('/products', {
                params: { search: searchTerm || undefined },
            });
            return response.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (productData: any) => {
            const response = await api.post('/products', productData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsModalOpen(false);
            setEditingProduct(null);
            showSuccess('Product created successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to create product');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.put(`/products/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsModalOpen(false);
            setEditingProduct(null);
            showSuccess('Product updated successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to update product');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showSuccess('Product deleted successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to delete product');
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            category: formData.get('category'),
            unit: formData.get('unit'),
            salePrice: parseFloat(formData.get('salePrice') as string) || 0,
            purchasePrice: parseFloat(formData.get('purchasePrice') as string) || 0,
        };

        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data: productData });
        } else {
            createMutation.mutate(productData);
        }
    };

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
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
                    <h1 className="text-3xl font-bold text-white mb-2">Products & Services</h1>
                    <p className="text-slate-400">Manage your product catalog</p>
                </div>
                <Button
                    variant="primary"
                    icon={<Plus className="w-5 h-5" />}
                    onClick={() => {
                        setEditingProduct(null);
                        setIsModalOpen(true);
                    }}
                >
                    Add Product
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
                                placeholder="Search products..."
                                className="input pl-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Products table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>All Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={8} />
                        ) : data?.products?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Sale Price</th>
                                            <th>Purchase Price</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.products.map((product: any, index: number) => (
                                            <motion.tr
                                                key={product.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="font-mono text-blue-400">{product.code}</td>
                                                <td className="font-medium">{product.name}</td>
                                                <td>
                                                    {product.category && (
                                                        <Badge variant="info">
                                                            {product.category}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="font-mono text-green-400">
                                                    ${product.salePrice?.toLocaleString() || '0.00'}
                                                </td>
                                                <td className="font-mono text-slate-400">
                                                    ${product.purchasePrice?.toLocaleString() || '0.00'}
                                                </td>
                                                <td>
                                                    <Badge variant={product.isActive ? 'success' : 'error'}>
                                                        {product.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
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
                                    <Package className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
                                <p className="text-slate-400 mb-4">Get started by adding your first product or service</p>
                                <Button
                                    variant="primary"
                                    icon={<Plus className="w-5 h-5" />}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    Add Product
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Product Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                }}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                defaultValue={editingProduct?.name}
                                className="input"
                                placeholder="Product or Service Name"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                defaultValue={editingProduct?.description}
                                className="input"
                                rows={3}
                                placeholder="Product description"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                name="category"
                                defaultValue={editingProduct?.category}
                                className="input"
                                placeholder="e.g., Software, Hardware"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Unit
                            </label>
                            <input
                                type="text"
                                name="unit"
                                defaultValue={editingProduct?.unit}
                                className="input"
                                placeholder="e.g., pcs, hrs, kg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Sale Price *
                            </label>
                            <input
                                type="number"
                                name="salePrice"
                                step="0.01"
                                required
                                defaultValue={editingProduct?.salePrice || 0}
                                className="input"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Purchase Price
                            </label>
                            <input
                                type="number"
                                name="purchasePrice"
                                step="0.01"
                                defaultValue={editingProduct?.purchasePrice || 0}
                                className="input"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingProduct(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingProduct ? 'Update Product' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
