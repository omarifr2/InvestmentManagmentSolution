import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft, ArrowDownCircle } from 'lucide-react';

interface Account {
    id: number;
    name: string;
    initialAmount: number;
}

interface SnapshotInput {
    accountId: number;
    amount: string;
    netContribution: string;
}

export function MonthlyUpdate() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [snapshots, setSnapshots] = useState<SnapshotInput[]>([]);
    const [month] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Transaction states
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
    const [transfer, setTransfer] = useState({ fromId: '', toId: '', amount: '' });
    const [withdrawal, setWithdrawal] = useState({ accountId: '', amount: '', note: '' });

    // Loading states
    const [isSnapshotSubmitting, setIsSnapshotSubmitting] = useState(false);
    const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);
    const [isWithdrawalSubmitting, setIsWithdrawalSubmitting] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const data = await api.get('/accounts');
            setAccounts(data);
            // Initialize snapshots with empty values or previous values if we fetched them
            setSnapshots(data.map((a: Account) => ({ accountId: a.id, amount: '', netContribution: '' })));
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const handleSnapshotChange = (accountId: number, field: 'amount' | 'netContribution', value: string) => {
        setSnapshots(prev =>
            prev.map(s => s.accountId === accountId ? { ...s, [field]: value } : s)
        );
    };

    const handleSaveSnapshots = async () => {
        setIsSnapshotSubmitting(true);
        try {
            const payload = snapshots
                .filter(s => s.amount !== '')
                .map(s => ({
                    accountId: s.accountId,
                    month: new Date().toISOString(), // Use current date for now
                    amountValue: parseFloat(s.amount),
                    netContribution: parseFloat(s.netContribution || '0')
                }));

            if (payload.length === 0) return;

            await api.post('/snapshots/batch', payload);
            alert('Snapshots saved successfully!');
            // Optionally clear or refresh
        } catch (error) {
            console.error('Failed to save snapshots:', error);
        } finally {
            setIsSnapshotSubmitting(false);
        }
    };

    const handleTransfer = async () => {
        setIsTransferSubmitting(true);
        try {
            await api.post('/transactions', {
                type: 2, // Transfer
                amount: parseFloat(transfer.amount),
                fromAccountId: parseInt(transfer.fromId),
                toAccountId: parseInt(transfer.toId),
                date: new Date().toISOString(),
                note: 'Transfer'
            });
            setIsTransferOpen(false);
            setTransfer({ fromId: '', toId: '', amount: '' });
            alert('Transfer recorded!');
        } catch (error) {
            console.error('Failed to record transfer:', error);
        } finally {
            setIsTransferSubmitting(false);
        }
    };

    const handleWithdrawal = async () => {
        setIsWithdrawalSubmitting(true);
        try {
            await api.post('/transactions', {
                type: 1, // Withdrawal
                amount: parseFloat(withdrawal.amount),
                fromAccountId: parseInt(withdrawal.accountId), // Using FromAccountId for withdrawal source
                date: new Date().toISOString(),
                note: withdrawal.note
            });
            setIsWithdrawalOpen(false);
            setWithdrawal({ accountId: '', amount: '', note: '' });
            alert('Withdrawal recorded!');
        } catch (error) {
            console.error('Failed to record withdrawal:', error);
        } finally {
            setIsWithdrawalSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Monthly Reconciliation</h1>
                <div className="flex gap-2">
                    <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <ArrowRightLeft className="mr-2 h-4 w-4" /> Record Transfer
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Record Transfer</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>From Account</Label>
                                    <Select onValueChange={(v) => setTransfer({ ...transfer, fromId: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>To Account</Label>
                                    <Select onValueChange={(v) => setTransfer({ ...transfer, toId: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Amount</Label>
                                    <Input type="number" onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })} />
                                </div>
                                <Button onClick={handleTransfer} isLoading={isTransferSubmitting}>Save Transfer</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive">
                                <ArrowDownCircle className="mr-2 h-4 w-4" /> Record Withdrawal
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Record Withdrawal</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Account</Label>
                                    <Select onValueChange={(v) => setWithdrawal({ ...withdrawal, accountId: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Amount</Label>
                                    <Input type="number" onChange={(e) => setWithdrawal({ ...withdrawal, amount: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Note</Label>
                                    <Input onChange={(e) => setWithdrawal({ ...withdrawal, note: e.target.value })} />
                                </div>
                                <Button onClick={handleWithdrawal} isLoading={isWithdrawalSubmitting}>Save Withdrawal</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Snapshots for {month}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account Name</TableHead>
                                    <TableHead>Last Month Amount</TableHead>
                                    <TableHead>New Capital (+/-)</TableHead>
                                    <TableHead>Current Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.map((account) => {
                                    const snapshot = snapshots.find(s => s.accountId === account.id);
                                    return (
                                        <TableRow key={account.id}>
                                            <TableCell className="font-medium">{account.name}</TableCell>
                                            <TableCell>${account.initialAmount.toLocaleString()}</TableCell> {/* Placeholder for last month */}
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={snapshot?.netContribution || ''}
                                                    onChange={(e) => handleSnapshotChange(account.id, 'netContribution', e.target.value)}
                                                    className="w-32"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={snapshot?.amount || ''}
                                                        onChange={(e) => handleSnapshotChange(account.id, 'amount', e.target.value)}
                                                        className="w-32"
                                                    />
                                                    {snapshot?.amount && (
                                                        <div className="text-xs">
                                                            {(() => {
                                                                const current = parseFloat(snapshot.amount);
                                                                const lastMonth = account.initialAmount; // TODO: Fetch actual last month value
                                                                const contribution = parseFloat(snapshot.netContribution || '0');

                                                                if (isNaN(current)) return null;

                                                                const gain = current - (lastMonth + contribution);
                                                                const isPositive = gain >= 0;

                                                                return (
                                                                    <span className={isPositive ? "text-green-600" : "text-red-600"}>
                                                                        Market {isPositive ? "Gain" : "Loss"}: {isPositive ? "+" : ""}${gain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleSaveSnapshots} isLoading={isSnapshotSubmitting}>Save All Snapshots</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
