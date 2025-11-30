'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Receipt, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/dashboard/stats');
            return response.data.data;
        },
    });

    const getStatusVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID':
            case 'RECEIVED':
                return 'success';
            case 'DRAFT':
            case 'SENT':
                return 'warning';
            case 'PARTIALLY_PAID':
                return 'info';
            case 'OVERDUE':
                return 'error';
            default:
                return 'default';
        }
    };

    const stats = [
        {
            title: 'Total Revenue',
            value: data?.totalRevenue || 0,
            icon: DollarSign,
            gradient: 'from-blue-500 to-purple-500',
        },
        {
            title: 'Total Expenses',
            value: data?.totalExpenses || 0,
            icon: TrendingUp,
            gradient: 'from-green-500 to-emerald-500',
        },
        {
            title: 'Active Customers',
            value: data?.activeCustomers || 0,
            icon: Users,
            gradient: 'from-amber-500 to-orange-500',
        },
        {
            title: 'Pending Invoices',
            value: data?.pendingInvoices || 0,
            icon: Receipt,
            gradient: 'from-pink-500 to-rose-500',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-slate-400">Welcome back! Here's what's happening with your business.</p>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="relative overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`} />
                            <CardContent className="relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                                    {isLoading ? (
                                        <Skeleton className="h-8 w-24" />
                                    ) : (
                                        <p className="text-2xl font-bold text-white">
                                            {stat.title.includes('Revenue') || stat.title.includes('Expenses')
                                                ? `$${stat.value.toLocaleString()}`
                                                : stat.value.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-48 mb-2" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                ))}
                            </div>
                        ) : data?.recentActivity?.length > 0 ? (
                            <div className="space-y-4">
                                {data.recentActivity.map((activity: any, index: number) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className={`p-2 rounded-full ${activity.type === 'Invoice'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-green-500/20 text-green-400'
                                            }`}>
                                            {activity.type === 'Invoice' ? (
                                                <Receipt className="w-5 h-5" />
                                            ) : (
                                                <DollarSign className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{activity.description}</p>
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-white font-mono">
                                                ${activity.amount.toLocaleString()}
                                            </span>
                                            <Badge variant={getStatusVariant(activity.status)}>
                                                {activity.status}
                                            </Badge>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                                    <Clock className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No recent activity</h3>
                                <p className="text-slate-400">Activity will appear here as you use the system</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
