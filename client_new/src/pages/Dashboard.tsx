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
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MonthlyProgressTable } from '@/components/dashboard/MonthlyProgressTable';
import { AccountCard } from '@/components/dashboard/AccountCard';

import { Account, Category, GoalDto, CategoryGoal, MonthlySnapshot } from '@/types';

export function Dashboard() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [globalGoal, setGlobalGoal] = useState<GoalDto | null>(null);
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

    const handleSetGoal = async (year: number, contributionGoal: number, categoryGoals: CategoryGoal[]) => {
        try {
            const response = await api.post('/goals', {
                year,
                contributionGoal,
                categoryGoals
            });
            setGlobalGoal(response);
        } catch (error) {
            console.error('Failed to set goal:', error);
            throw error;
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
                        <Button variant="outline" onClick={() => setIsSetGoalOpen(true)}>Set Goals</Button>
                        <GlobalGoalModal
                            isOpen={isSetGoalOpen}
                            onOpenChange={setIsSetGoalOpen}
                            onSave={handleSetGoal}
                            initialGoal={globalGoal}
                            categories={categories}
                        />
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
                                    <CurrencyInput
                                        id="initial"
                                        value={newAccount.initialAmount}
                                        onChange={(val) => setNewAccount({ ...newAccount, initialAmount: val })}
                                    />
                                </div>
                                <Button onClick={handleAddAccount} isLoading={isAccountSubmitting}>Save Account</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Category Goal Cards */}
                {categories.map(category => {
                    const categoryGoal = globalGoal?.categoryGoals.find(g => g.categoryId === category.id);
                    if (!categoryGoal) return null;

                    const categoryAccounts = accounts.filter(a => a.categoryId === category.id);
                    const currentCategoryValue = categoryAccounts.reduce((sum, a) => sum + (a.currentValue || 0), 0);
                    const progress = (currentCategoryValue / categoryGoal.targetAmount) * 100;

                    return (
                        <Card key={category.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {category.name} Goal
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${currentCategoryValue.toLocaleString()}
                                    <span className="text-sm font-normal text-muted-foreground ml-2">of ${categoryGoal.targetAmount.toLocaleString()}</span>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Contribution Goal Card */}
                {globalGoal && globalGoal.contributionGoal > 0 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Contribution Goal ({new Date().getFullYear()})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(() => {
                                    const currentYear = new Date().getFullYear();
                                    const totalContributions = accounts.reduce((sum, account) => {
                                        const currentYearSnapshots = account.snapshots?.filter(s => new Date(s.month).getFullYear() === currentYear) || [];
                                        const accountContributions = currentYearSnapshots.reduce((accSum, s) => accSum + (s.netContribution || 0), 0);
                                        return sum + accountContributions;
                                    }, 0);
                                    const progress = (totalContributions / globalGoal.contributionGoal) * 100;

                                    return (
                                        <>
                                            ${totalContributions.toLocaleString()}
                                            <span className="text-sm font-normal text-muted-foreground ml-2">of ${globalGoal.contributionGoal.toLocaleString()}</span>
                                            <div className="mt-4 space-y-2">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Progress</span>
                                                    <span>{Math.round(progress)}%</span>
                                                </div>
                                                <Progress value={progress} className="h-2 bg-blue-100" />
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <MonthlyProgressTable accounts={accounts} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                ))}
            </div>
        </div>
    );
}
