import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { ArrowRightLeft, ArrowDownCircle, CheckCircle, AlertCircle } from 'lucide-react';

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

interface ServerSnapshot {
    id: number;
    accountId: number;
    month: string;
    amountValue: number;
    netContribution: number;
}

export function MonthlyUpdate() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [snapshots, setSnapshots] = useState<SnapshotInput[]>([]);
    const [serverSnapshots, setServerSnapshots] = useState<ServerSnapshot[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

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
        fetchData();
    }, []);

    // Hydrate form when month or server data changes
    useEffect(() => {
        if (accounts.length === 0) return;

        setSnapshots(accounts.map(account => {
            // Find existing snapshot for this account and month
            const existing = serverSnapshots.find(s =>
                s.accountId === account.id &&
                s.month.startsWith(selectedMonth)
            );

            return {
                accountId: account.id,
                amount: existing ? existing.amountValue.toString() : '',
                netContribution: existing ? existing.netContribution.toString() : ''
            };
        }));
    }, [selectedMonth, accounts, serverSnapshots]);

    const fetchData = async () => {
        try {
            const [accountsData, snapshotsData] = await Promise.all([
                api.get('/accounts'),
                api.get('/snapshots')
            ]);
            setAccounts(accountsData);
            setServerSnapshots(snapshotsData);
        } catch (error) {
            console.error('Failed to load data:', error);
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
                    month: `${selectedMonth}-01T00:00:00Z`, // Construct full date
                    amountValue: parseFloat(s.amount),
                    netContribution: parseFloat(s.netContribution || '0')
                }));

            if (payload.length === 0) return;

            await api.post('/snapshots/batch', payload);

            // Refresh data to update "Saved" status
            const snapshotsData = await api.get('/snapshots');
            setServerSnapshots(snapshotsData);

            alert('Snapshots saved successfully!');
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
                                    <CurrencyInput value={transfer.amount} onChange={(val) => setTransfer({ ...transfer, amount: val })} />
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
                                    <CurrencyInput value={withdrawal.amount} onChange={(val) => setWithdrawal({ ...withdrawal, amount: val })} />
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
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="month-select">Month:</Label>
                                <Input
                                    id="month-select"
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-auto"
                                />
                            </div>
                            <CardTitle>Snapshots for {selectedMonth}</CardTitle>
                        </div>
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
                                    const serverSnapshot = serverSnapshots.find(s =>
                                        s.accountId === account.id &&
                                        s.month.startsWith(selectedMonth)
                                    );

                                    // Check if synced
                                    const currentAmount = parseFloat(snapshot?.amount || '0');
                                    const currentContribution = parseFloat(snapshot?.netContribution || '0');
                                    const serverAmount = serverSnapshot ? serverSnapshot.amountValue : 0;
                                    const serverContribution = serverSnapshot ? serverSnapshot.netContribution : 0;

                                    // It is saved if values match. 
                                    // Note: We compare against 0 if no server snapshot exists.
                                    const isSaved = Math.abs(currentAmount - serverAmount) < 0.01 &&
                                        Math.abs(currentContribution - serverContribution) < 0.01;

                                    return (
                                        <TableRow key={account.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {account.name}
                                                    {isSaved ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>${account.initialAmount.toLocaleString()}</TableCell> {/* Placeholder for last month */}
                                            <TableCell>
                                                <CurrencyInput
                                                    placeholder="0.00"
                                                    value={snapshot?.netContribution || ''}
                                                    onChange={(val) => handleSnapshotChange(account.id, 'netContribution', val)}
                                                    className="w-32"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <CurrencyInput
                                                        placeholder="0.00"
                                                        value={snapshot?.amount || ''}
                                                        onChange={(val) => handleSnapshotChange(account.id, 'amount', val)}
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
