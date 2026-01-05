'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CreditCard, Wallet, Receipt, Calendar, ArrowRight, TrendingUp, TrendingDown, Users, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { getUserStats, getDues, getExpensesByCategory, getSummary } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CategoryPieChart } from '@/components/Charts';
import { CategoryBreakdown } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface UserStat {
    user: { _id: string; name: string; email: string; profileImage?: string };
    paid: number;
    taken: number;
    owes: number;
    owed: number;
    net: number;
    settled: number;
}

interface Due {
    from: { _id: string; name: string };
    to: { _id: string; name: string };
    amount: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<any>(null);
    const [stats, setStats] = useState<UserStat[]>([]);
    const [dues, setDues] = useState<Due[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, statsRes, duesRes, categoryRes] = await Promise.all([
                getSummary(), // Could allow params if needed, but summary is usually overall
                getUserStats({ month: Number(month), year: Number(year) }),
                getDues({ month: Number(month), year: Number(year) }),
                getExpensesByCategory({ month: Number(month), year: Number(year) }),
            ]);
            setSummary(summaryRes.data.data);
            setStats(statsRes.data.data.stats);
            setDues(duesRes.data.data.dues);
            setCategoryData(categoryRes.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentUserStats = stats.find(s => s.user._id === user?._id);
    const otherUsers = stats.filter(s => s.user._id !== user?._id);

    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];
    const years = Array.from({ length: 10 }, (_, i) => ({
        value: String(new Date().getFullYear() - i),
        label: String(new Date().getFullYear() - i),
    }));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <LayoutDashboard className="w-8 h-8 text-primary" /> Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {format(new Date(Number(year), Number(month) - 1), 'MMMM yyyy')} Overview
                    </p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y.value} value={y.value}>
                                    {y.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {/* Current User Stats */}
                    <div>
                        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Your Summary
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Paid Card */}
                            <Card className="bg-gradient-to-br from-[#9E3B3B] to-[#D25353] text-white border-0 shadow-lg shadow-[#D25353]/25">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-sm font-medium">You Paid</p>
                                            <p className="text-3xl font-bold mt-1">
                                                ৳{currentUserStats?.paid.toLocaleString() || 0}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Taken Card */}
                            <Card className="bg-gradient-to-br from-[#D25353] to-[#EA7B7B] text-white border-0 shadow-lg shadow-[#EA7B7B]/25">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-sm font-medium">You Consumed</p>
                                            <p className="text-3xl font-bold mt-1">
                                                ৳{currentUserStats?.taken.toLocaleString() || 0}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <Receipt className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Due Card */}
                            <Card className={`text-white border-0 shadow-lg ${(currentUserStats?.net ?? 0) >= 0
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25'
                                : 'bg-gradient-to-br from-[#9E3B3B] to-[#D25353] shadow-[#D25353]/25'
                                }`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-sm font-medium">
                                                {(currentUserStats?.net ?? 0) >= 0 ? 'Others Owe You' : 'You Owe'}
                                            </p>
                                            <p className="text-3xl font-bold mt-1">
                                                ৳{Math.abs(currentUserStats?.net || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            {(currentUserStats?.net ?? 0) >= 0 ? (
                                                <TrendingUp className="w-6 h-6" />
                                            ) : (
                                                <TrendingDown className="w-6 h-6" />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Settled Card */}
                            <Card className="bg-gradient-to-br from-orange-400 to-orange-500 text-white border-0 shadow-lg shadow-orange-500/25">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white/80 text-sm font-medium">Settled Amount</p>
                                            <p className="text-3xl font-bold mt-1">
                                                ৳{currentUserStats?.settled.toLocaleString() || 0}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Other Users Stats */}
                    <div>
                        <h2 className="text-xl font-semibold text-foreground mb-4">
                            Others&apos; Summary
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {otherUsers.map((stat) => (
                                <Card key={stat.user._id} className="border-border/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Avatar className="h-12 w-12 border-2 border-[#EA7B7B]/30">
                                                {stat.user.profileImage ? (
                                                    <AvatarImage src={stat.user.profileImage} alt={stat.user.name} />
                                                ) : null}
                                                <AvatarFallback className="bg-gradient-to-br from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] text-white font-bold text-lg">
                                                    {stat.user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold text-foreground">{stat.user.name}</h3>
                                                <p className="text-sm text-muted-foreground">{stat.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="p-3 rounded-xl bg-accent/50">
                                                <p className="text-xs text-muted-foreground mb-1">Paid</p>
                                                <p className="text-lg font-bold text-[#D25353]">
                                                    ৳{stat.paid.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-accent/50">
                                                <p className="text-xs text-muted-foreground mb-1">Taken</p>
                                                <p className="text-lg font-bold text-[#EA7B7B]">
                                                    ৳{stat.taken.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-accent/50">
                                                <p className="text-xs text-muted-foreground mb-1">Net</p>
                                                <p className={`text-lg font-bold ${stat.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#9E3B3B]'
                                                    }`}>
                                                    {stat.net >= 0 ? '+' : ''}৳{stat.net.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Who Owes Whom */}
                    {dues.length > 0 && (
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-primary" />
                                    Pending Dues
                                </CardTitle>
                                <CardDescription>
                                    Outstanding balances between users
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {dues.map((due, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-4 bg-accent/50 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge variant="destructive" className="bg-[#9E3B3B] hover:bg-[#9E3B3B]">
                                                    {due.from.name}
                                                </Badge>
                                                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                                                    {due.to.name}
                                                </Badge>
                                            </div>
                                            <span className="text-lg font-bold text-foreground">
                                                ৳{due.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Category Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CategoryPieChart data={categoryData} />

                        {/* Total Expense */}
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle>Total Expenses This Month</CardTitle>
                                <CardDescription>Combined spending by all users</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center h-48">
                                    <div className="text-center">
                                        <p className="text-5xl font-bold gradient-text">
                                            ৳{stats.reduce((sum, s) => sum + s.paid, 0).toLocaleString()}
                                        </p>
                                        <p className="text-muted-foreground mt-2">
                                            by all {stats.length} users
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
