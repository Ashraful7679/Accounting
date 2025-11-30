'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Calendar, Download, BookOpen, Filter } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { showSuccess, showError } from '@/lib/toast';

export default function LedgerPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['ledger', searchTerm, selectedAccount, startDate, endDate],
        queryFn: async () => {
            const params: any = { limit: 1000 };
            if (searchTerm) params.search = searchTerm;
            if (selectedAccount) params.accountId = selectedAccount;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/ledger', { params });
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

    const handleExport = async () => {
        try {
            const params: any = { limit: 10000 };
            if (searchTerm) params.search = searchTerm;
            if (selectedAccount) params.accountId = selectedAccount;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/ledger', { params });
            const entries = response.data.data.entries;

            if (!entries || entries.length === 0) {
                showError('No entries to export');
                return;
            }

            // Dynamically import jsPDF
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            // Add title
            doc.setFontSize(18);
            doc.text('General Ledger', 14, 20);

            // Add filters info
            doc.setFontSize(10);
            let yPos = 30;
            if (selectedAccount) {
                const account = accountsData?.accounts?.find((a: any) => a.id === selectedAccount);
                if (account) {
                    doc.text(`Account: ${account.code} - ${account.name}`, 14, yPos);
                    yPos += 6;
                }
            }
            if (startDate || endDate) {
                const dateRange = `Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`;
                doc.text(dateRange, 14, yPos);
                yPos += 6;
            }

            // Add table
            autoTable(doc, {
                startY: yPos + 4,
                head: [['Date', 'Account', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']],
                body: entries.map((entry: any) => [
                    format(new Date(entry.date), 'yyyy-MM-dd'),
                    entry.account?.name || '',
                    entry.description || '',
                    entry.reference || '',
                    entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-',
                    entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-',
                    `$${(entry.balance || 0).toLocaleString()}`,
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [71, 85, 105] },
            });

            // Save PDF
            doc.save(`ledger-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

            showSuccess('Ledger exported successfully!');
        } catch (error: any) {
            console.error('Export error:', error);
            showError(error.message || 'Failed to export ledger');
        }
    };

    const clearFilters = () => {
        setSelectedAccount('');
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
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
                    <h1 className="text-3xl font-bold text-white mb-2">General Ledger</h1>
                    <p className="text-slate-400">View all account transactions and balances</p>
                </div>
                <Button variant="primary" icon={<Download className="w-5 h-5" />} onClick={handleExport}>
                    Export Ledger
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
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search transactions..."
                                        className="input pl-11"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    icon={<Filter className="w-5 h-5" />}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </Button>
                            </div>

                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Account
                                        </label>
                                        <select
                                            className="input"
                                            value={selectedAccount}
                                            onChange={(e) => setSelectedAccount(e.target.value)}
                                        >
                                            <option value="">All Accounts</option>
                                            {accountsData?.accounts?.map((account: any) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.code} - {account.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-3 flex justify-end">
                                        <Button variant="secondary" onClick={clearFilters}>
                                            Clear Filters
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Ledger table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Ledger Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={10} />
                        ) : data?.entries?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Account</th>
                                            <th>Description</th>
                                            <th>Reference</th>
                                            <th>Debit</th>
                                            <th>Credit</th>
                                            <th>Balance</th>
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
                                                <td>{format(new Date(entry.date), 'MMM dd, yyyy')}</td>
                                                <td className="font-medium">{entry.account?.name}</td>
                                                <td className="text-slate-400">{entry.description}</td>
                                                <td className="font-mono text-blue-400">{entry.reference || '-'}</td>
                                                <td className="font-mono text-green-400">
                                                    {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="font-mono text-red-400">
                                                    {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="font-mono font-semibold">
                                                    ${(entry.balance || 0).toLocaleString()}
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
                                <h3 className="text-lg font-semibold text-white mb-2">No ledger entries yet</h3>
                                <p className="text-slate-400">Transactions will appear here once you start recording entries</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
