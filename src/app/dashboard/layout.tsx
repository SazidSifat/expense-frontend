'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Wallet } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isLoading, logout } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col  lg:flex-row">
            {/* Mobile Top Navbar */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/50 px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Left: Spacer for hamburger menu */}
                    <div className="w-10" />

                    {/* Center: Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] flex items-center justify-center shadow-md">
                            <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold gradient-text">ExpenseTracker</span>
                    </div>

                    {/* Right: User actions */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Avatar className="h-8 w-8 border border-[#EA7B7B]/30">
                            {user?.profileImage ? (
                                <AvatarImage src={user.profileImage} alt={user.name} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] text-white text-xs font-bold">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <Sidebar />
            <main className="flex-1 pt-20 lg:pt-0 p-6 lg:p-8 overflow-auto">
                <div className="max-w-7xl py-10 mx-auto">{children}</div>
            </main>
        </div>
    );
}

