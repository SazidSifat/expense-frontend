'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Search, Calendar, Users, Receipt, Loader2 } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense, getUsers } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import { User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const CATEGORIES = ['Food', 'Transport', 'Rent', 'Utility', 'Others'];

interface UserWithAmount {
    userId: string;
    amount: string;
    selected: boolean;
}

interface ExpenseData {
    _id: string;
    date: string;
    amount: number;
    category: string;
    reason: string;
    givers: { user: User; amount: number }[];
    takers: { user: User; amount: number }[];
    createdBy: User;
}

export default function ExpensesPage() {
    const { isAdmin } = useAuth();
    const [expenses, setExpenses] = useState<ExpenseData[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Form state
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        category: 'Food',
        reason: '',
    });
    const [giverAmounts, setGiverAmounts] = useState<UserWithAmount[]>([]);
    const [takerAmounts, setTakerAmounts] = useState<UserWithAmount[]>([]);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [month, year, categoryFilter]);

    useEffect(() => {
        if (users.length > 0 && giverAmounts.length === 0) {
            setGiverAmounts(users.map((u, i) => ({
                userId: u._id,
                amount: '',
                selected: i === 0
            })));
            setTakerAmounts(users.map(u => ({
                userId: u._id,
                amount: '',
                selected: true
            })));
        }
    }, [users]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [expensesRes, usersRes] = await Promise.all([
                getExpenses({ month: Number(month), year: Number(year), category: categoryFilter === 'all' ? undefined : categoryFilter }),
                getUsers(),
            ]);
            setExpenses(expensesRes.data.data);
            setUsers(usersRes.data.data);
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        const selectedGivers = giverAmounts.filter(g => g.selected && parseFloat(g.amount) > 0);
        const selectedTakers = takerAmounts.filter(t => t.selected && parseFloat(t.amount) > 0);

        if (selectedGivers.length === 0) {
            setFormError('Please select at least one giver with an amount');
            return;
        }

        if (selectedTakers.length === 0) {
            setFormError('Please select at least one taker with an amount');
            return;
        }

        const giverTotal = selectedGivers.reduce((sum, g) => sum + parseFloat(g.amount), 0);
        const takerTotal = selectedTakers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const paidAmount = parseFloat(formData.amount);

        if (Math.abs(giverTotal - paidAmount) > 0.01) {
            setFormError(`Giver amounts (৳${giverTotal.toFixed(2)}) must equal total amount (৳${paidAmount.toFixed(2)})`);
            return;
        }

        if (Math.abs(takerTotal - paidAmount) > 0.01) {
            setFormError(`Taker amounts (৳${takerTotal.toFixed(2)}) must equal total amount (৳${paidAmount.toFixed(2)})`);
            return;
        }

        setIsSubmitting(true);

        try {
            const givers = selectedGivers.map(g => ({
                user: g.userId,
                amount: parseFloat(g.amount)
            }));

            const takers = selectedTakers.map(t => ({
                user: t.userId,
                amount: parseFloat(t.amount)
            }));

            const data = {
                date: formData.date,
                amount: paidAmount,
                category: formData.category,
                reason: formData.reason,
                givers,
                takers,
            };

            console.log('Submitting expense data:', data);

            if (editingExpense) {
                const response = await updateExpense(editingExpense._id, data);
                toast.success('Expense updated successfully');
                console.log('Update response:', response.data);
            } else {
                const response = await createExpense(data);
                toast.success('Expense created successfully');
                console.log('Create response:', response.data);
            }

            setIsModalOpen(false);
            setEditingExpense(null);
            resetForm();
            await fetchData();
        } catch (err: unknown) {
            console.error('Expense save error:', err);
            const error = err as { response?: { data?: { message?: string } } };
            setFormError(error.response?.data?.message || 'Failed to save expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (expense: ExpenseData) => {
        setEditingExpense(expense);
        setFormData({
            date: format(new Date(expense.date), 'yyyy-MM-dd'),
            amount: expense.amount.toString(),
            category: expense.category,
            reason: expense.reason,
        });

        const expenseGiverIds = expense.givers.map(g => g.user._id);
        setGiverAmounts(users.map(u => {
            const expenseGiver = expense.givers.find(g => g.user._id === u._id);
            return {
                userId: u._id,
                amount: expenseGiver ? expenseGiver.amount.toString() : '',
                selected: expenseGiverIds.includes(u._id)
            };
        }));

        const expenseTakerIds = expense.takers.map(t => t.user._id);
        setTakerAmounts(users.map(u => {
            const expenseTaker = expense.takers.find(t => t.user._id === u._id);
            return {
                userId: u._id,
                amount: expenseTaker ? expenseTaker.amount.toString() : '',
                selected: expenseTakerIds.includes(u._id)
            };
        }));

        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        console.log('Deleting expense with ID:', id);


        try {
            await deleteExpense(id);
            toast.success('Expense deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete expense');
            console.error('Failed to delete expense:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            date: format(new Date(), 'yyyy-MM-dd'),
            amount: '',
            category: 'Food',
            reason: '',
        });
        setGiverAmounts(users.map((u, i) => ({
            userId: u._id,
            amount: '',
            selected: i === 0
        })));
        setTakerAmounts(users.map(u => ({
            userId: u._id,
            amount: '',
            selected: true
        })));
        setFormError('');
    };

    const openAddModal = () => {
        setEditingExpense(null);
        resetForm();
        setIsModalOpen(true);
    };

    const toggleGiver = (userId: string) => {
        setGiverAmounts(prev => prev.map(g =>
            g.userId === userId
                ? { ...g, selected: !g.selected, amount: !g.selected ? '' : g.amount }
                : g
        ));
    };

    const updateGiverAmount = (userId: string, amount: string) => {
        setGiverAmounts(prev => prev.map(g =>
            g.userId === userId ? { ...g, amount, selected: true } : g
        ));
    };

    const toggleTaker = (userId: string) => {
        setTakerAmounts(prev => prev.map(t =>
            t.userId === userId
                ? { ...t, selected: !t.selected, amount: !t.selected ? '' : t.amount }
                : t
        ));
    };

    const updateTakerAmount = (userId: string, amount: string) => {
        setTakerAmounts(prev => prev.map(t =>
            t.userId === userId ? { ...t, amount, selected: true } : t
        ));
    };

    const fillSingleGiver = (userId: string) => {
        setGiverAmounts(users.map(u => ({
            userId: u._id,
            amount: u._id === userId ? formData.amount : '',
            selected: u._id === userId
        })));
    };

    const splitTakersEqually = () => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setFormError('Please enter a total amount first');
            return;
        }
        const selectedTakers = takerAmounts.filter(t => t.selected);
        const selectedCount = selectedTakers.length > 0 ? selectedTakers.length : users.length;
        const splitAmount = (parseFloat(formData.amount) / selectedCount).toFixed(2);

        if (selectedTakers.length === 0) {
            // If none selected, select all
            setTakerAmounts(users.map(u => ({
                userId: u._id,
                amount: splitAmount,
                selected: true
            })));
        } else {
            // Split among selected
            setTakerAmounts(prev => prev.map(t => ({
                ...t,
                amount: t.selected ? splitAmount : ''
            })));
        }
        setFormError('');
    };

    const selectAllTakers = () => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setFormError('Please enter a total amount first');
            return;
        }
        const splitAmount = (parseFloat(formData.amount) / users.length).toFixed(2);
        setTakerAmounts(users.map(u => ({
            userId: u._id,
            amount: splitAmount,
            selected: true
        })));
        setFormError('');
    };

    const giverTotal = giverAmounts.filter(g => g.selected).reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
    const takerTotal = takerAmounts.filter(t => t.selected).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const filteredExpenses = expenses.filter(
        (e) =>
            e.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.givers.some(g => g.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Receipt className="w-8 h-8 text-primary" />
                        Expenses
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track who paid and who benefited
                    </p>
                </div>
                <Button onClick={openAddModal} className="bg-gradient-to-r from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] hover:from-[#8A3232] hover:via-[#C24A4A] hover:to-[#E06E6E] gap-2">
                    <Plus className="w-5 h-5" />
                    Add Expense
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
                <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px]">
                    <Input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="flex-1 sm:w-[130px]">
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
                        <SelectTrigger className="flex-1 sm:w-[100px]">
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
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table - Hidden on mobile */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Mobile Cards View */}
                    <div className="md:hidden space-y-4">
                        {filteredExpenses.length === 0 ? (
                            <Card className="border-border/50">
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No expenses found
                                </CardContent>
                            </Card>
                        ) : (
                            filteredExpenses.map((expense) => (
                                <Card key={expense._id} className="border-border/50 overflow-hidden">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-lg font-bold text-[#D25353]">
                                                    ৳{expense.amount.toLocaleString()}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                            <Badge variant="secondary">{expense.category}</Badge>
                                        </div>

                                        {expense.reason && (
                                            <p className="text-sm text-foreground">{expense.reason}</p>
                                        )}

                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Paid by</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {expense.givers?.map((g) => (
                                                        <Badge key={g.user._id} className="bg-[#D25353]/20 text-[#9E3B3B] dark:text-[#EA7B7B] hover:bg-[#D25353]/20 text-xs">
                                                            {g.user.name} (৳{g.amount.toFixed(0)})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Benefited</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {expense.takers?.map((t) => (
                                                        <Badge key={t.user._id} className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs">
                                                            {t.user.name} (৳{t.amount.toFixed(0)})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(expense)}
                                                className="hover:bg-[#FFEAD3] gap-1"
                                            >
                                                <Pencil className="w-4 h-4 text-[#D25353]" />
                                                Edit
                                            </Button>
                                            {isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(expense._id)}
                                                    className="hover:bg-destructive/10 gap-1"
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <Card className="border-border/50 hidden md:block">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Givers</TableHead>
                                        <TableHead>Takers</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExpenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-medium">
                                                No expenses found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredExpenses.map((expense) => (
                                            <TableRow key={expense._id}>
                                                <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell className="font-semibold text-[#D25353]">
                                                    ৳{expense.amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {expense.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">{expense.reason || '-'}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {expense.givers?.map((g) => (
                                                            <Badge key={g.user._id} className="bg-[#D25353]/20 text-[#9E3B3B] dark:text-[#EA7B7B] hover:bg-[#D25353]/20">
                                                                {g.user.name} (৳{g.amount.toFixed(0)})
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {expense.takers?.map((t) => (
                                                            <Badge key={t.user._id} className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100">
                                                                {t.user.name} (৳{t.amount.toFixed(0)})
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(expense)}
                                                            className="hover:bg-[#FFEAD3] rounded-xl"
                                                        >
                                                            <Pencil className="w-4 h-4 text-[#D25353]" />
                                                        </Button>
                                                        {isAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(expense._id)}
                                                                className="hover:bg-destructive/10 rounded-xl"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Total */}
            <div className="flex justify-end">
                <Card className="border-border/50">
                    <CardContent className="py-3 px-4">
                        <span className="text-muted-foreground">Total: </span>
                        <span className="text-xl font-bold gradient-text">
                            ৳{filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingExpense ? 'Edit Expense' : 'Add Expense'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl text-sm border border-destructive/20">
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Total Amount (৳)</Label>
                            <Input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="Enter amount"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                <SelectTrigger className='w-full'>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Reason / Notes</Label>
                            <Input
                                type="text"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Description"
                            />
                        </div>
                    </div>

                    {/* Givers Section */}
                    <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                            <Label>Who Paid (Givers)</Label>
                            <div className="flex flex-wrap gap-2">
                                {users.map(u => (
                                    <Button
                                        key={u._id}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fillSingleGiver(u._id)}
                                        className="text-xs h-7 px-2 hover:bg-[#FFEAD3]"
                                    >
                                        {u.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 p-3 bg-[#FFEAD3]/30 dark:bg-[#4A2E2E]/30 rounded-lg border border-[#EA7B7B]/20">
                            {users.map((user) => {
                                const giver = giverAmounts.find(g => g.userId === user._id);
                                const isSelected = giver?.selected || false;

                                return (
                                    <div
                                        key={user._id}
                                        className={`flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-lg transition-colors ${isSelected
                                            ? 'bg-[#FFEAD3] dark:bg-[#4A2E2E] border border-[#EA7B7B]/30'
                                            : 'bg-card border border-border'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleGiver(user._id)}
                                            className="w-4 h-4 accent-[#D25353]"
                                        />
                                        <span className={`flex-1 min-w-[100px] text-sm sm:text-base font-medium ${isSelected ? 'text-[#9E3B3B] dark:text-[#EA7B7B]' : 'text-muted-foreground'}`}>
                                            {user.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">৳</span>
                                            <Input
                                                type="number"
                                                value={giver?.amount || ''}
                                                onChange={(e) => updateGiverAmount(user._id, e.target.value)}
                                                placeholder="Amount"
                                                min="0"
                                                step="0.01"
                                                className="w-20 sm:w-24 h-8"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="text-right text-sm">
                                <span className={`font-medium ${formData.amount && Math.abs(giverTotal - parseFloat(formData.amount || '0')) < 0.01
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-[#D25353]'
                                    }`}>
                                    Total: ৳{giverTotal.toFixed(2)} / ৳{parseFloat(formData.amount || '0').toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Takers Section */}
                    <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                            <Label>Who Benefited (Takers)</Label>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={selectAllTakers}
                                    className="text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-700 gap-1"
                                >
                                    <Users className="w-3 h-3" />
                                    All Equal
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={splitTakersEqually}
                                    className="text-xs h-7 px-2"
                                >
                                    Split Selected
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                            {users.map((user) => {
                                const taker = takerAmounts.find(t => t.userId === user._id);
                                const isSelected = taker?.selected || false;

                                return (
                                    <div
                                        key={user._id}
                                        className={`flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-lg transition-colors ${isSelected
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-card border border-border'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleTaker(user._id)}
                                            className="w-4 h-4 accent-emerald-500"
                                        />
                                        <span className={`flex-1 min-w-[100px] text-sm sm:text-base font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                                            {user.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">৳</span>
                                            <Input
                                                type="number"
                                                value={taker?.amount || ''}
                                                onChange={(e) => updateTakerAmount(user._id, e.target.value)}
                                                placeholder="Amount"
                                                min="0"
                                                step="0.01"
                                                className="w-20 sm:w-24 h-8"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="text-right text-sm">
                                <span className={`font-medium ${formData.amount && Math.abs(takerTotal - parseFloat(formData.amount || '0')) < 0.01
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-[#D25353]'
                                    }`}>
                                    Total: ৳{takerTotal.toFixed(2)} / ৳{parseFloat(formData.amount || '0').toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-[#9E3B3B] via-[#D25353] to-[#EA7B7B] hover:from-[#8A3232] hover:via-[#C24A4A] hover:to-[#E06E6E]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            {isSubmitting ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
