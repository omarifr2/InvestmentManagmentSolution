import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface MonthlySnapshot {
    id: number;
    accountId: number;
    month: string;
    amountValue: number;
}

interface Account {
    id: number;
    name: string;
    categoryId: number;
    category?: { name: string };
    initialAmount: number;
    yearGoal?: number;
    currentValue?: number; // Calculated from snapshots (mocked for now or fetched)
    snapshots?: MonthlySnapshot[];
}

interface Category {
    id: number;
    name: string;
}

export function Dashboard() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

    // Form states
    const [newAccount, setNewAccount] = useState({ name: '', categoryId: '', initialAmount: '', yearGoal: '' });
    const [newCategory, setNewCategory] = useState({ name: '' });
    const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [accountsData, categoriesData, snapshotsData] = await Promise.all([
                api.get('/accounts'),
                api.get('/categories'),
                api.get('/snapshots')
            ]);

            // Attach snapshots to their respective accounts
            const accountsWithSnapshots = accountsData.map((account: Account) => ({
                ...account,
                snapshots: snapshotsData.filter((s: MonthlySnapshot) => s.accountId === account.id)
            }));

            setAccounts(accountsWithSnapshots);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // Calculate YTD Return %
    const calculateYTDReturn = (snapshots?: MonthlySnapshot[]): number | null => {
        if (!snapshots || snapshots.length === 0) return null;

        const currentYear = new Date().getFullYear();

        // Filter snapshots for current year and sort by date
        const currentYearSnapshots = snapshots
            .filter(s => new Date(s.month).getFullYear() === currentYear)
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        if (currentYearSnapshots.length === 0) return null;

        const initialAmount = currentYearSnapshots[0].amountValue;
        const currentAmount = currentYearSnapshots[currentYearSnapshots.length - 1].amountValue;

        if (initialAmount === 0) return null;

        return ((currentAmount - initialAmount) / initialAmount) * 100;
    };

    const handleAddAccount = async () => {
        setIsAccountSubmitting(true);
        try {
            await api.post('/accounts', {
                name: newAccount.name,
                categoryId: parseInt(newAccount.categoryId),
                initialAmount: parseFloat(newAccount.initialAmount),
                yearGoal: newAccount.yearGoal ? parseFloat(newAccount.yearGoal) : null
            });
            setIsAddAccountOpen(false);
            setNewAccount({ name: '', categoryId: '', initialAmount: '', yearGoal: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to add account:', error);
        } finally {
            setIsAccountSubmitting(false);
        }
    };

    const handleAddCategory = async () => {
        try {
            await api.post('/categories', { name: newCategory.name });
            setIsAddCategoryOpen(false);
            setNewCategory({ name: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to add category:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex gap-2">
                    <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">Add Category</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Category</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="category-name">Name</Label>
                                    <Input
                                        id="category-name"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    />
                                </div>
                                <Button onClick={handleAddCategory}>Save Category</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Account</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={newAccount.name}
                                        onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={newAccount.categoryId}
                                        onValueChange={(value) => setNewAccount({ ...newAccount, categoryId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="initial">Initial Amount</Label>
                                    <Input
                                        id="initial"
                                        type="number"
                                        value={newAccount.initialAmount}
                                        onChange={(e) => setNewAccount({ ...newAccount, initialAmount: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="goal">Year Goal (Optional)</Label>
                                    <Input
                                        id="goal"
                                        type="number"
                                        value={newAccount.yearGoal}
                                        onChange={(e) => setNewAccount({ ...newAccount, yearGoal: e.target.value })}
                                    />
                                </div>
                                <Button onClick={handleAddAccount} isLoading={isAccountSubmitting}>Save Account</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => {
                    // Mock progress calculation (since we don't have current value yet, use initial or 0)
                    // In real app, we'd fetch the latest snapshot value
                    const currentValue = account.initialAmount; // Placeholder
                    const progress = account.yearGoal ? (currentValue / account.yearGoal) * 100 : 0;

                    // Calculate YTD Return
                    const ytdReturn = calculateYTDReturn(account.snapshots);

                    return (
                        <Card key={account.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {account.name}
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">{account.category?.name}</span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${currentValue.toLocaleString()}</div>

                                {/* YTD Return % */}
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">YTD Return:</span>
                                    <span
                                        className={`text-sm font-semibold ${ytdReturn === null
                                            ? 'text-muted-foreground'
                                            : ytdReturn >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        {ytdReturn === null ? '--' : `${ytdReturn.toFixed(1)}%`}
                                    </span>
                                </div>

                                {account.yearGoal && (
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Progress</span>
                                            <span>{Math.round(progress)}% of ${account.yearGoal.toLocaleString()}</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
