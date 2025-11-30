'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
    LayoutDashboard,
    FileText,
    Users,
    Package,
    Receipt,
    CreditCard,
    BookOpen,
    BarChart3,
    TrendingUp,
    Building2,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ShoppingCart,
    UserCog,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        setUser(JSON.parse(userData));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: BookOpen, label: 'Journal Entries', href: '/dashboard/journal-entries' },
        { icon: BarChart3, label: 'Ledger', href: '/dashboard/ledger' },
        { icon: TrendingUp, label: 'Trial Balance', href: '/dashboard/trial-balance' },
        { icon: FileText, label: 'Chart of Accounts', href: '/dashboard/accounts' },
        { icon: Users, label: 'Customers', href: '/dashboard/customers' },
        { icon: Building2, label: 'Vendors', href: '/dashboard/vendors' },
        { icon: Package, label: 'Products', href: '/dashboard/products' },
        { icon: Receipt, label: 'Invoices', href: '/dashboard/invoices' },
        { icon: ShoppingCart, label: 'Purchases', href: '/dashboard/purchases' },
        { icon: UserCog, label: 'User Management', href: '/dashboard/users' },
    ];

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed left-0 top-0 h-full w-64 glass-strong border-r border-slate-700/50 z-30"
                    >
                        <div className="flex flex-col h-full">
                            {/* Logo */}
                            <div className="p-6 border-b border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
                                        <BarChart3 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-white">Accounting</h1>
                                        <p className="text-xs text-slate-400">Software</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                                {navItems.map((item, index) => (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={item.href}
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-200 group"
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    </motion.div>
                                ))}
                            </nav>

                            {/* User section */}
                            <div className="p-4 border-t border-slate-700/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                                        {user.name?.charAt(0) || user.email?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{user.name || 'User'}</p>
                                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                {/* Header */}
                <header className="sticky top-0 z-20 glass border-b border-slate-700/50">
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            {isSidebarOpen ? (
                                <X className="w-6 h-6 text-slate-300" />
                            ) : (
                                <Menu className="w-6 h-6 text-slate-300" />
                            )}
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">{user.name || 'User'}</p>
                                <p className="text-xs text-slate-400">Administrator</p>
                            </div>
                            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold shadow-glow">
                                {user.name?.charAt(0) || user.email?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {/* Toast Notifications */}
            <Toaster />
        </div>
    );
}
