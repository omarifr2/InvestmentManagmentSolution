import { useState, useMemo } from 'react';
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

import { Account } from '@/types';

interface MonthlyProgressTableProps {
    accounts: Account[];
}

export function MonthlyProgressTable({ accounts }: MonthlyProgressTableProps) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

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
                monthlyData[monthIndex] = {
                    amount: snapshot.amountValue,
                    contribution: snapshot.netContribution
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
    }, [accounts, selectedYear]);

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

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
                                                            <span className={`text-[10px] ${
                                                                data.contribution > 0 
                                                                    ? 'text-green-600' 
                                                                    : 'text-red-600'
                                                            }`}>
                                                                ({data.contribution > 0 ? '+' : ''}
                                                                ${data.contribution.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                                                            </span>
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
