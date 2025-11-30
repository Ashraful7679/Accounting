'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Calendar, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { showSuccess, showError } from '@/lib/toast';

export default function TrialBalancePage() {
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['trial-balance', asOfDate],
        queryFn: async () => {
            const response = await api.get('/trial-balance', {
                params: { asOfDate },
            });
            return response.data.data;
        },
    });

    const totalDebits = data?.accounts?.reduce((sum: number, acc: any) => sum + (acc.debit || 0), 0) || 0;
    const totalCredits = data?.accounts?.reduce((sum: number, acc: any) => sum + (acc.credit || 0), 0) || 0;
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    const handleExport = async () => {
        try {
            if (!data?.accounts || data.accounts.length === 0) {
                showError('No data to export');
                return;
            }

            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            // Add title
            doc.setFontSize(18);
            doc.text('Trial Balance', 14, 20);

            // Add date
            doc.setFontSize(10);
            doc.text(`As of: ${format(new Date(asOfDate), 'MMMM dd, yyyy')}`, 14, 30);

            // Add table
            autoTable(doc, {
                startY: 40,
                head: [['Account Code', 'Account Name', 'Account Type', 'Debit', 'Credit']],
                body: [
                    ...data.accounts.map((account: any) => [
                        account.code,
                        account.name,
                        account.type,
                        account.debit > 0 ? `$${account.debit.toLocaleString()}` : '-',
                        account.credit > 0 ? `$${account.credit.toLocaleString()}` : '-',
                    ]),
                    ['', '', 'TOTAL', `$${totalDebits.toLocaleString()}`, `$${totalCredits.toLocaleString()}`],
                ],
                styles: { fontSize: 8 },
                headStyles: { fillColor: [71, 85, 105] },
                footStyles: { fillColor: [51, 65, 85], fontStyle: 'bold' },
            });

            // Add balance status
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            // doc.setTextColor(isBalanced ? 0, 128, 0 : 255, 165, 0);
            doc.text(`Status: ${isBalanced ? 'Balanced ✓' : 'Unbalanced ⚠'}`, 14, finalY);

            doc.save(`trial-balance-${format(new Date(asOfDate), 'yyyy-MM-dd')}.pdf`);
            showSuccess('Trial balance exported successfully!');
        } catch (error: any) {
            console.error('Export error:', error);
            showError(error.message || 'Failed to export trial balance');
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
                    <h1 className="text-3xl font-bold text-white mb-2">Trial Balance</h1>
                    <p className="text-slate-400">Verify the equality of debits and credits</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        icon={<Calendar className="w-5 h-5" />}
                        onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                        {format(new Date(asOfDate), 'MMM dd, yyyy')}
                    </Button>
                    <Button variant="primary" icon={<Download className="w-5 h-5" />} onClick={handleExport}>
                        Export PDF
                    </Button>
                </div>
            </motion.div>

            {/* Date picker */}
            {showDatePicker && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-slate-300">As of Date:</label>
                                <input
                                    type="date"
                                    value={asOfDate}
                                    onChange={(e) => setAsOfDate(e.target.value)}
                                    className="input"
                                />
                                <Button variant="secondary" size="sm" onClick={() => setShowDatePicker(false)}>
                                    Close
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-green-500/20">
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Total Debits</p>
                                    <p className="text-2xl font-bold text-white">${totalDebits.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-red-500/20">
                                    <TrendingDown className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Total Credits</p>
                                    <p className="text-2xl font-bold text-white">${totalCredits.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${isBalanced ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
                                    <BarChart3 className={`w-6 h-6 ${isBalanced ? 'text-blue-400' : 'text-amber-400'}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Status</p>
                                    <p className={`text-2xl font-bold ${isBalanced ? 'text-green-400' : 'text-amber-400'}`}>
                                        {isBalanced ? 'Balanced' : 'Unbalanced'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Trial balance table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Account Balances</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <TableSkeleton rows={10} />
                        ) : data?.accounts?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Account Code</th>
                                            <th>Account Name</th>
                                            <th>Account Type</th>
                                            <th className="text-right">Debit</th>
                                            <th className="text-right">Credit</th>
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
                                                <td className="text-slate-400">{account.type}</td>
                                                <td className="font-mono text-right text-green-400">
                                                    {account.debit > 0 ? `$${account.debit.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="font-mono text-right text-red-400">
                                                    {account.credit > 0 ? `$${account.credit.toLocaleString()}` : '-'}
                                                </td>
                                            </motion.tr>
                                        ))}
                                        <tr className="border-t-2 border-slate-700 font-bold">
                                            <td colSpan={3} className="text-right text-white">Total</td>
                                            <td className="font-mono text-right text-green-400">
                                                ${totalDebits.toLocaleString()}
                                            </td>
                                            <td className="font-mono text-right text-red-400">
                                                ${totalCredits.toLocaleString()}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                                    <BarChart3 className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No trial balance data</h3>
                                <p className="text-slate-400">Start recording transactions to generate a trial balance</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
