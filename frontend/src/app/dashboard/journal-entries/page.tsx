'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Calendar, BookOpen, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { showSuccess, showError } from '@/lib/toast';
import { Modal } from '@/components/ui/Modal';

interface JournalLine {
    accountId: string;
    description: string;
    debit: number;
    credit: number;
}

export default function JournalEntriesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingEntry, setViewingEntry] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [lines, setLines] = useState<JournalLine[]>([
        { accountId: '', description: '', debit: 0, credit: 0 },
        { accountId: '', description: '', debit: 0, credit: 0 },
    ]);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['journal-entries', searchTerm],
        queryFn: async () => {
            const response = await api.get('/journal-entries', {
                params: { search: searchTerm || undefined },
            });
            return response.data.data;
        },
    });

    const { data: accountsData } = useQuery({
        queryKey: ['accounts-all'],
        queryFn: async () => {
            const response = await api.get('/accounts', { params: { limit: 1000 } });
            return response.data.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (entryData: any) => {
            const response = await api.post('/journal-entries', entryData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            setIsModalOpen(false);
            resetForm();
            showSuccess('Journal entry created successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to create journal entry');
        },
    });

    const postMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/journal-entries/${id}/post`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            showSuccess('Journal entry posted successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to post journal entry');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/journal-entries/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            showSuccess('Journal entry deleted successfully!');
        },
        onError: (error: any) => {
            showError(error.response?.data?.error?.message || 'Failed to delete journal entry');
        },
    });

    const resetForm = () => {
        setLines([
            { accountId: '', description: '', debit: 0, credit: 0 },
            { accountId: '', description: '', debit: 0, credit: 0 },
        ]);
    };

    const addLine = () => {
        setLines([...lines, { accountId: '', description: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (index: number) => {
        if (lines.length > 2) {
            setLines(lines.filter((_, i) => i !== index));
        }
    };

    const updateLine = (index: number, field: keyof JournalLine, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const totalDebits = lines.reduce((sum, line) => sum + (parseFloat(line.debit.toString()) || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (parseFloat(line.credit.toString()) || 0), 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const entryData = {
            date: formData.get('date'),
            description: formData.get('description'),
            reference: formData.get('reference'),
            createdById: JSON.parse(localStorage.getItem('user') || '{}').id,
            lines: lines.map(line => ({
                accountId: line.accountId,
                description: line.description,
                debit: parseFloat(line.debit.toString()) || 0,
                credit: parseFloat(line.credit.toString()) || 0,
            })),
        };

        createMutation.mutate(entryData);
    };

    const handlePost = (id: string) => {
        if (confirm('Are you sure you want to post this entry? This action cannot be undone.')) {
            postMutation.mutate(id);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this journal entry?')) {
            deleteMutation.mutate(id);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case 'POSTED':
                return 'success';
            case 'DRAFT':
                return 'warning';
            case 'REVERSED':
                return 'error';
            default:
                return 'default';
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
                    <h1 className="text-3xl font-bold text-white mb-2">Journal Entries</h1>
                    <p className="text-slate-400">Record and manage accounting transactions</p>
                </div>
                <Button
                    variant="primary"
                    icon={<Plus className="w-5 h-5" />}
                    onClick={() => setIsModalOpen(true)}
                >
                    New Entry
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
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search journal entries..."
                                    className="input pl-11"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Journal entries table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>All Journal Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={8} />
                        ) : data?.entries?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Entry #</th>
                                            <th>Date</th>
                                            <th>Description</th>
                                            <th>Reference</th>
                                            <th>Total Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.entries.map((entry: any, index: number) => (
                                            <motion.tr
                                                key={entry.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <td className="font-mono text-blue-400">{entry.entryNumber}</td>
                                                <td>{format(new Date(entry.date), 'MMM dd, yyyy')}</td>
                                                <td className="font-medium">{entry.description}</td>
                                                <td className="text-slate-400">{entry.reference || '-'}</td>
                                                <td className="font-mono">
                                                    ${(entry.lines?.reduce((sum: number, line: any) => sum + (line.debit || 0), 0) || 0).toLocaleString()}
                                                </td>
                                                <td>
                                                    <Badge variant={getStatusVariant(entry.status)}>
                                                        {entry.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setViewingEntry(entry)}
                                                            className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                                                            title="View Entry"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {entry.status === 'DRAFT' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handlePost(entry.id)}
                                                                    className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors"
                                                                    title="Post Entry"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(entry.id)}
                                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                                    title="Delete Entry"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {/* Admin can delete posted entries */}
                                                        {entry.status === 'POSTED' && (
                                                            <button
                                                                onClick={() => handleDelete(entry.id)}
                                                                className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                                title="Delete Entry (Admin)"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
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
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                                    <BookOpen className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No journal entries yet</h3>
                                <p className="text-slate-400 mb-4">Create your first journal entry</p>
                                <Button
                                    variant="primary"
                                    icon={<Plus className="w-5 h-5" />}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    New Entry
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Journal Entry Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                title="Create Journal Entry"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
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
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Description *
                            </label>
                            <input
                                type="text"
                                name="description"
                                required
                                className="input"
                                placeholder="Enter transaction description"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Reference
                            </label>
                            <input
                                type="text"
                                name="reference"
                                className="input"
                                placeholder="Optional reference number"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Journal Lines</h3>
                            <Button type="button" variant="secondary" size="sm" onClick={addLine}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Line
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {lines.map((line, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 items-start p-3 bg-slate-800/50 rounded-lg">
                                    <div className="col-span-4">
                                        <select
                                            value={line.accountId}
                                            onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                                            className="input text-sm"
                                            required
                                        >
                                            <option value="">Select Account</option>
                                            {accountsData?.accounts?.map((account: any) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.code} - {account.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="text"
                                            value={line.description}
                                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                                            className="input text-sm"
                                            placeholder="Line description"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={line.debit || ''}
                                            onChange={(e) => updateLine(index, 'debit', e.target.value)}
                                            className="input text-sm"
                                            placeholder="Debit"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={line.credit || ''}
                                            onChange={(e) => updateLine(index, 'credit', e.target.value)}
                                            className="input text-sm"
                                            placeholder="Credit"
                                        />
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                        {lines.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm text-slate-400">Total Debits:</span>
                                    <span className="ml-2 font-mono text-green-400">${totalDebits.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-slate-400">Total Credits:</span>
                                    <span className="ml-2 font-mono text-red-400">${totalCredits.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-slate-400">Difference:</span>
                                    <span className={`ml-2 font-mono ${isBalanced ? 'text-green-400' : 'text-amber-400'}`}>
                                        ${Math.abs(totalDebits - totalCredits).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            {!isBalanced && totalDebits > 0 && (
                                <p className="text-sm text-amber-400 mt-2">
                                    ⚠️ Debits and credits must be equal
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={createMutation.isPending}
                            disabled={!isBalanced}
                        >
                            Create Entry
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Entry Modal */}
            <Modal
                isOpen={!!viewingEntry}
                onClose={() => setViewingEntry(null)}
                title="Journal Entry Details"
                size="lg"
            >
                {viewingEntry && (
                    <div className="space-y-6">
                        {/* Entry Header */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg">
                            <div>
                                <p className="text-sm text-slate-400">Entry Number</p>
                                <p className="text-lg font-mono text-blue-400">{viewingEntry.entryNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Date</p>
                                <p className="text-lg text-white">{format(new Date(viewingEntry.date), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Status</p>
                                <Badge variant={getStatusVariant(viewingEntry.status)}>
                                    {viewingEntry.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Reference</p>
                                <p className="text-white">{viewingEntry.reference || '-'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-slate-400">Description</p>
                                <p className="text-white">{viewingEntry.description}</p>
                            </div>
                        </div>

                        {/* Entry Lines */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Journal Lines</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="text-left py-2 text-sm text-slate-400">Account</th>
                                            <th className="text-left py-2 text-sm text-slate-400">Description</th>
                                            <th className="text-right py-2 text-sm text-slate-400">Debit</th>
                                            <th className="text-right py-2 text-sm text-slate-400">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingEntry.lines?.map((line: any, index: number) => (
                                            <tr key={index} className="border-b border-slate-800">
                                                <td className="py-3 text-white">
                                                    <div className="font-mono text-sm text-blue-400">{line.account?.code}</div>
                                                    <div className="text-sm">{line.account?.name}</div>
                                                </td>
                                                <td className="py-3 text-slate-300">{line.description || '-'}</td>
                                                <td className="py-3 text-right font-mono text-green-400">
                                                    {line.debit > 0 ? `$${line.debit.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="py-3 text-right font-mono text-red-400">
                                                    {line.credit > 0 ? `$${line.credit.toLocaleString()}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-700">
                                            <td colSpan={2} className="py-3 text-right font-semibold text-white">Total:</td>
                                            <td className="py-3 text-right font-mono font-bold text-green-400">
                                                ${viewingEntry.lines?.reduce((sum: number, line: any) => sum + (line.debit || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="py-3 text-right font-mono font-bold text-red-400">
                                                ${viewingEntry.lines?.reduce((sum: number, line: any) => sum + (line.credit || 0), 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={() => setViewingEntry(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
