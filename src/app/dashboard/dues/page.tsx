'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ArrowRight, RefreshCw, CheckCircle, Clock, Trash2, Scale, Loader2 } from 'lucide-react';
import { getDues, getUserStats, settleDues, rolloverBalances, getSettlements, deleteSettlement } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Due {
    from: { _id: string; name: string };
    to: { _id: string; name: string };
    amount: number;
}

interface UserStat {
    user: { _id: string; name: string; email: string };
    paid: number;
    taken: number;
    settled: number;
    owes: number;
    owed: number;
    net: number;
}

interface Settlement {
    _id: string;
    fromUser: { _id: string; name: string };
    toUser: { _id: string; name: string };
    amount: number;
    date: string;
    note: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
}

export default function DuesPage() {
    const { isAdmin } = useAuth();
    const [dues, setDues] = useState<Due[]>([]);
    const [stats, setStats] = useState<UserStat[]>([]);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [settleAmount, setSettleAmount] = useState('');
    const [settleFrom, setSettleFrom] = useState('');
    const [settleTo, setSettleTo] = useState('');
    const [isSettling, setIsSettling] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showRolloverConfirm, setShowRolloverConfirm] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [duesRes, statsRes, settlementsRes] = await Promise.all([
                getDues({ month: Number(month), year: Number(year) }),
                getUserStats({ month: Number(month), year: Number(year) }),
                getSettlements({ month: Number(month), year: Number(year) }),
            ]);
            setDues(duesRes.data.data.dues);
            setUsers(duesRes.data.data.users);
            setStats(statsRes.data.data.stats);
            setSettlements(settlementsRes.data.data.settlements);
        } catch (error) {
            console.error('Failed to fetch dues:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettle = async () => {
        if (!settleFrom || !settleTo || !settleAmount) return;

        setIsSettling(true);
        try {
            await settleDues({
                fromUser: settleFrom,
                toUser: settleTo,
                amount: parseFloat(settleAmount),
                month: Number(month),
                year: Number(year),
            });
            setSettleAmount('');
            setSettleFrom('');
            setSettleTo('');
            toast.success('Payment recorded successfully!');
            fetchData();
        } catch (error) {
            console.error('Failed to settle dues:', error);
            toast.error('Failed to record payment.');
        } finally {
            setIsSettling(false);
        }
    };

    const handleRollover = async () => {
        setShowRolloverConfirm(false);
        try {
            await rolloverBalances({ month: Number(month), year: Number(year) });
            toast.success('Balances rolled over successfully!');
            fetchData();
        } catch (error) {
            console.error('Failed to rollover:', error);
            toast.error('Failed to rollover balances.');
        }
    };

    const handleDeleteSettlement = async () => {
        if (!deleteConfirmId) return;
        const id = deleteConfirmId;
        setDeleteConfirmId(null);

        setDeletingId(id);
        try {
            await deleteSettlement(id);
            toast.success('Settlement deleted successfully.');
            fetchData();
        } catch (error) {
            console.error('Failed to delete settlement:', error);
            toast.error('Failed to delete settlement.');
        } finally {
            setDeletingId(null);
        }
    };

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
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Scale className="w-8 h-8 text-primary" />
                        Dues
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Person-to-person balance tracking
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground hidden sm:block" />
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[130px]">
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
                    <Button variant="outline" onClick={() => setShowRolloverConfirm(true)} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Rollover
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Balance Summary */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Balance Summary</CardTitle>
                            <CardDescription>Overview of each user&apos;s financial status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {stats.map((s) => (
                                <div
                                    key={s.user._id}
                                    className={`p-4 rounded-xl transition-colors ${s.net > 0
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                                        : s.net < 0
                                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                            : 'bg-accent/50 border border-border'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-foreground">
                                                {s.user.name}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <Badge variant="secondary">
                                                    Paid: ৳{s.paid.toFixed(0)}
                                                </Badge>
                                                <Badge variant="secondary">
                                                    Taken: ৳{s.taken.toFixed(0)}
                                                </Badge>
                                                {s.settled > 0 && (
                                                    <Badge className="bg-[#D25353] hover:bg-[#D25353]">
                                                        Settled: ৳{s.settled.toFixed(2)}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`text-2xl font-bold ${s.net > 0
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : s.net < 0
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-muted-foreground'
                                            }`}>
                                            {s.net > 0 ? '+' : ''}৳{s.net.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Who Owes Whom */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Who Owes Whom</CardTitle>
                            <CardDescription>Pending person-to-person balances</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {dues.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                                    <p>All settled! No pending dues.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {dues.map((due, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-4 bg-accent/50 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3 flex-wrap">
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
                            )}
                        </CardContent>
                    </Card>


                    {/* Settle Dues Form */}
                    <Card className="lg:col-span-2 border-border/50">
                        <CardHeader>
                            <CardTitle>Settle Dues</CardTitle>
                            <CardDescription>Record a payment between users</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[180px] space-y-2">
                                    <Label>Who Paid</Label>
                                    <Select value={settleFrom} onValueChange={setSettleFrom}>
                                        <SelectTrigger className='w-full'>
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u._id} value={u._id}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 min-w-[180px] space-y-2">
                                    <Label>Paid To</Label>
                                    <Select value={settleTo} onValueChange={setSettleTo}>
                                        <SelectTrigger className='w-full'>
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u._id} value={u._id}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 min-w-[180px] space-y-2">
                                    <Label>Amount (৳)</Label>
                                    <Input
                                        type="number"
                                        value={settleAmount}
                                        onChange={(e) => setSettleAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        min="0"
                                    />
                                </div>
                                <Button
                                    onClick={handleSettle}
                                    disabled={isSettling || !settleFrom || !settleTo || !settleAmount}
                                    className="bg-gradient-to-r from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] hover:from-[#8A3232] hover:via-[#C24A4A] hover:to-[#E06E6E] h-10"
                                >
                                    {isSettling ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    {isSettling ? 'Recording...' : 'Mark as Paid'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settlement History */}
                    <Card className="lg:col-span-2 border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Settlement History
                            </CardTitle>
                            <CardDescription>Record of all payment settlements</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {settlements.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No settlements recorded this month.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {settlements.map((s) => (
                                        <div
                                            key={s._id}
                                            className="flex items-center justify-between p-4 bg-[#FFEAD3]/50 dark:bg-[#4A2E2E]/30 rounded-xl border border-[#EA7B7B]/20"
                                        >
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Badge className="bg-[#D25353] hover:bg-[#D25353]">
                                                    {s.fromUser.name}
                                                </Badge>
                                                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                                                    {s.toUser.name}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-foreground">
                                                        ৳{s.amount.toFixed(0)}
                                                    </span>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(s.date), 'MMM d, yyyy h:mm a')}
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteConfirmId(s._id)}
                                                        disabled={deletingId === s._id}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                                    >
                                                        {deletingId === s._id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>


                </div>
            )}

            {/* Rollover Confirmation Dialog */}
            <AlertDialog open={showRolloverConfirm} onOpenChange={setShowRolloverConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rollover Balances</AlertDialogTitle>
                        <AlertDialogDescription>
                            Carry forward balances from {format(new Date(Number(year), Number(month) - 1), 'MMMM yyyy')} to next month?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRollover}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Settlement Confirmation Dialog */}
            <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Settlement</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this settlement? The balance will be restored.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSettlement} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
