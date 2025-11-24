import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, BarChart3, Wallet } from 'lucide-react';

export function Layout() {
    const location = useLocation();

    const navItems = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/monthly-update', label: 'Monthly Update', icon: CalendarDays },
        { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
                <div className="p-6 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                    <Wallet className="h-6 w-6 text-blue-600" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">InvestManager</span>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
