'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Trash2, Database, History } from 'lucide-react';
import { clearDatabase, deleteSettlementHistory, getActivityLogs } from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchLogs();
        }
    }, [user]);

    const fetchLogs = async () => {
        try {
            const res = await getActivityLogs();
            setLogs(res.data.data);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        }
    };

    // Only allow admin access
    if (user?.role !== 'admin') {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        Only administrators can access this page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const handleClearDatabase = async () => {
        if (!confirm('EXTREME WARNING: This will delete ALL data (expenses, settlements, balances). This action CANNOT be undone. Are you sure?')) {
            return;
        }

        setIsLoading(true);
        setMessage(null);
        try {
            await clearDatabase();
            setMessage({ type: 'success', text: 'Database cleared successfully.' });
            fetchLogs(); // Refresh logs
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to clear database.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteHistory = async () => {
        if (!confirm('WARNING: This will delete all settlement history logs. Are you sure?')) {
            return;
        }

        setIsLoading(true);
        setMessage(null);
        try {
            await deleteSettlementHistory();
            setMessage({ type: 'success', text: 'Settlement history deleted successfully.' });
            fetchLogs(); // Refresh logs
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete history.' });
        } finally {
            setIsLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
            case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
            case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            case 'CLEAR': return 'bg-red-900 text-white dark:bg-red-950 dark:text-red-200';
            case 'SETTLE': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>

            {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                    <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            <Card className='w-full'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Data Management
                    </CardTitle>
                    <CardDescription>
                        Destructive actions for database management.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="destructive"
                        className="w-full justify-start gap-2"
                        onClick={handleClearDatabase}
                        disabled={isLoading}
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear Entire Database
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Removes all expenses, settlements, and balances. Users are preserved.
                    </p>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
                        onClick={handleDeleteHistory}
                        disabled={isLoading}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Settlement History
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Removes only the settlement transaction logs. Balances remain unaffected.
                    </p>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Activity Logs
                    </CardTitle>
                    <CardDescription>
                        Recent administrative and system actions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border h-[400px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No activity logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log._id}>
                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {log.user?.name || 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getActionColor(log.action)} variant="outline">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{log.entity}</TableCell>
                                            <TableCell className="text-xs font-mono max-w-[300px] truncate" title={JSON.stringify(log.details, null, 2)}>
                                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        // </div>
    );
}
