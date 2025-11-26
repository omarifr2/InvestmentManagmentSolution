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
import { GlobalGoalModal } from '@/components/goals/GlobalGoalModal';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MonthlyProgressTable } from '@/components/dashboard/MonthlyProgressTable';

import { Account, Category, GlobalGoal, MonthlySnapshot } from '@/types';

export function Dashboard() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [globalGoal, setGlobalGoal] = useState<GlobalGoal | null>(null);
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [isSetGoalOpen, setIsSetGoalOpen] = useState(false);

    // Form states
    const [newAccount, setNewAccount] = useState({ name: '', categoryId: '', initialAmount: '' });
    const [newCategory, setNewCategory] = useState({ name: '' });
    const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
    const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const currentYear = new Date().getFullYear();
            const [accountsData, categoriesData, snapshotsData, goalData] = await Promise.all([
                api.get('/accounts'),
                api.get('/categories'),
                api.get('/snapshots'),
                api.get(`/goals/${currentYear}`).catch(() => null) // Handle 404 if no goal set
            ]);

            // Attach snapshots to their respective accounts
            const accountsWithSnapshots = accountsData.map((account: Account) => {
                // Determine current value from latest snapshot or initial amount
                const accountSnapshots = snapshotsData.filter((s: MonthlySnapshot) => s.accountId === account.id);
                const sortedSnapshots = accountSnapshots.sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime());
                const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
                const currentValue = latestSnapshot ? latestSnapshot.amountValue : account.initialAmount;

                return {
                    ...account,
                    snapshots: accountSnapshots,
                    currentValue
                };
            });

            setAccounts(accountsWithSnapshots);
            setCategories(categoriesData);
            if (goalData) {
                setGlobalGoal(goalData);
            }
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

        // Calculate total invested capital (Initial + Net Contributions)
        // We sum net contributions from all snapshots *after* the initial one
        const netContributions = currentYearSnapshots.slice(1).reduce((sum, s) => sum + (s.netContribution || 0), 0);
        const totalInvested = initialAmount + netContributions;

        if (totalInvested === 0) return null;

        const totalGain = currentAmount - totalInvested;
        return (totalGain / totalInvested) * 100;
    };

    const handleAddAccount = async () => {
        setIsAccountSubmitting(true);
        try {
            await api.post('/accounts', {
                name: newAccount.name,
                categoryId: parseInt(newAccount.categoryId),
                initialAmount: parseFloat(newAccount.initialAmount)
            });
            setIsAddAccountOpen(false);
            setNewAccount({ name: '', categoryId: '', initialAmount: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to add account:', error);
        } finally {
            setIsAccountSubmitting(false);
        }
    };

    const handleAddCategory = async () => {
        setIsCategorySubmitting(true);
        try {
            await api.post('/categories', { name: newCategory.name });
            setIsAddCategoryOpen(false);
            setNewCategory({ name: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to add category:', error);
        } finally {
            setIsCategorySubmitting(false);
        }
    };

    const handleSetGoal = async (year: number, amount: number) => {
        // setIsGoalSubmitting(true); // Handled inside modal now
        try {
            const response = await api.post('/goals', {
                year: year,
                targetAmount: amount
            });
            setGlobalGoal(response);
            // setIsSetGoalOpen(false); // Handled by modal callback
        } catch (error) {
            console.error('Failed to set goal:', error);
            throw error; // Re-throw to let modal handle error state if needed
        }
    };

    const totalPortfolioValue = accounts.reduce((sum, account) => sum + (account.currentValue || 0), 0);
    const globalProgress = globalGoal ? (totalPortfolioValue / globalGoal.targetAmount) * 100 : 0;

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
                                <Button onClick={handleAddCategory} isLoading={isCategorySubmitting}>Save Category</Button>
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
                                <Button onClick={handleAddAccount} isLoading={isAccountSubmitting}>Save Account</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Portfolio Goal ({new Date().getFullYear()})
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsSetGoalOpen(true)}>Set Goal</Button>
                    <GlobalGoalModal
                        isOpen={isSetGoalOpen}
                        onOpenChange={setIsSetGoalOpen}
                        onSave={handleSetGoal}
                        initialGoal={globalGoal}
                    />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${totalPortfolioValue.toLocaleString()}
                        {globalGoal && <span className="text-sm font-normal text-muted-foreground ml-2">of ${globalGoal.targetAmount.toLocaleString()}</span>}
                    </div>
                    {globalGoal && (
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{Math.round(globalProgress)}%</span>
                            </div>
                            <Progress value={globalProgress} className="h-2" />
                        </div>
                    )}
                </CardContent>
            </Card>

            <MonthlyProgressTable accounts={accounts} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => {
                    // Mock progress calculation (since we don't have current value yet, use initial or 0)
                    // In real app, we'd fetch the latest snapshot value
                    const currentValue = account.currentValue || account.initialAmount;

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
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
