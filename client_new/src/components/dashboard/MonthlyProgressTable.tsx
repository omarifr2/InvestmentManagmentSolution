import { useState, useMemo, useEffect } from 'react';
import { api } from '@/services/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    PlusCircle,
    MinusCircle,
    ArrowRightCircle,
    ArrowLeftCircle
} from 'lucide-react';

import { Account } from '@/types';

interface MonthlyProgressTableProps {
    accounts: Account[];
}

interface Transaction {
    id: number;
    type: number; // 0: Contribution, 1: Withdrawal, 2: Transfer
    amount: number;
    fromAccountId?: number;
    toAccountId?: number;
    date: string;
    note: string;
}

export function MonthlyProgressTable({ accounts }: MonthlyProgressTableProps) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Extract all available years from snapshots
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        years.add(currentYear); // Always include current year

        accounts.forEach(account => {
            account.snapshots?.forEach(snapshot => {
                const year = new Date(snapshot.month).getFullYear();
                years.add(year);
            });
        });

        return Array.from(years).sort((a, b) => b - a); // Descending order
    }, [accounts, currentYear]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const data = await api.get(`/transactions?year=${selectedYear}`) as Transaction[];
                setTransactions(data);
            } catch (error) {
                console.error("Failed to fetch transactions", error);
            }
        };
        fetchTransactions();
    }, [selectedYear]);

    // Process data for the table
    const tableData = useMemo(() => {
        return accounts.map(account => {
            // Initialize array for 12 months with null
            const monthlyData = Array(12).fill(null);
            let hasData = false;
            let totalValue = 0;

            // Filter snapshots for this account and selected year
            const accountSnapshots = account.snapshots?.filter(s =>
                new Date(s.month).getFullYear() === selectedYear
            ) || [];

            accountSnapshots.forEach(snapshot => {
                const monthIndex = new Date(snapshot.month).getMonth(); // 0-11

                // Determine movement type based on transactions
                // Find transactions for this account in this month
                const monthTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getFullYear() === selectedYear &&
                        tDate.getMonth() === monthIndex &&
                        (t.fromAccountId === account.id || t.toAccountId === account.id);
                });

                let movementType: 'transfer-in' | 'transfer-out' | 'contribution' | 'withdrawal' | null = null;
                let relatedAccountName: string | undefined;
                const netContribution = snapshot.netContribution;

                if (netContribution !== 0) {
                    // Check for transfers first
                    const transferInTransaction = monthTransactions.find(t => t.type === 2 && t.toAccountId === account.id);
                    const transferOutTransaction = monthTransactions.find(t => t.type === 2 && t.fromAccountId === account.id);

                    if (netContribution > 0) {
                        if (transferInTransaction) {
                            movementType = 'transfer-in';
                            const fromAccount = accounts.find(a => a.id === transferInTransaction.fromAccountId);
                            relatedAccountName = fromAccount?.name;
                        }
                        else movementType = 'contribution';
                    } else {
                        if (transferOutTransaction) {
                            movementType = 'transfer-out';
                            const toAccount = accounts.find(a => a.id === transferOutTransaction.toAccountId);
                            relatedAccountName = toAccount?.name;
                        }
                        else movementType = 'withdrawal';
                    }
                }

                monthlyData[monthIndex] = {
                    amount: snapshot.amountValue,
                    contribution: snapshot.netContribution,
                    movementType,
                    relatedAccountName
                };
                totalValue += snapshot.amountValue;
                if (snapshot.amountValue > 0) hasData = true;
            });

            return {
                ...account,
                monthlyData,
                hasData: hasData || totalValue > 0
            };
        }).filter(account => account.hasData); // Filter out accounts with no capital in the selected year
    }, [accounts, selectedYear, transactions]);

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'transfer-in':
                return <ArrowRightCircle className="h-3 w-3 text-blue-500" />;
            case 'transfer-out':
                return <ArrowLeftCircle className="h-3 w-3 text-orange-500" />;
            case 'contribution':
                return <PlusCircle className="h-3 w-3 text-green-500" />;
            case 'withdrawal':
                return <MinusCircle className="h-3 w-3 text-red-500" />;
            default:
                return null;
        }
    };

    const getMovementLabel = (type: string, relatedAccountName?: string) => {
        switch (type) {
            case 'transfer-in': return relatedAccountName ? `Transfer from ${relatedAccountName}` : 'Transfer In';
            case 'transfer-out': return relatedAccountName ? `Transfer to ${relatedAccountName}` : 'Transfer Out';
            case 'contribution': return 'New Contribution';
            case 'withdrawal': return 'Withdrawal';
            default: return '';
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Monthly Progress</CardTitle>
                <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Account Name</TableHead>
                                {months.map(month => (
                                    <TableHead key={month} className="text-right text-xs px-2">
                                        {month}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tableData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={13} className="h-24 text-center">
                                        No data available for {selectedYear}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tableData.map((account) => (
                                    <TableRow key={account.id}>
                                        <TableCell className="font-medium">
                                            {account.name}
                                        </TableCell>
                                        {account.monthlyData.map((data, index) => (
                                            <TableCell key={index} className="text-right font-mono text-xs px-2 align-top">
                                                {data ? (
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span>
                                                            ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        </span>
                                                        {data.contribution !== undefined && data.contribution !== 0 && (
                                                            <div className="flex items-center gap-1 justify-end">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            {getMovementIcon(data.movementType)}
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{getMovementLabel(data.movementType, data.relatedAccountName)}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                <span className={`text-[10px] ${data.contribution > 0
                                                                    ? 'text-green-600'
                                                                    : 'text-red-600'
                                                                    }`}>
                                                                    ({data.contribution > 0 ? '+' : ''}
                                                                    ${data.contribution.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
