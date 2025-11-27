import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Account, MonthlySnapshot } from '@/types';

interface AccountCardProps {
    account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
    const calculateMetrics = (snapshots?: MonthlySnapshot[]) => {
        if (!snapshots || snapshots.length === 0) {
            return {
                marketReturn: null,
                totalGrowth: null,
                currentValue: account.initialAmount
            };
        }

        const currentYear = new Date().getFullYear();

        // Filter snapshots for current year and sort by date
        const currentYearSnapshots = snapshots
            .filter(s => new Date(s.month).getFullYear() === currentYear)
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        if (currentYearSnapshots.length === 0) {
            return {
                marketReturn: null,
                totalGrowth: null,
                currentValue: account.initialAmount
            };
        }

        const initialAmount = currentYearSnapshots[0].amountValue;
        const currentAmount = currentYearSnapshots[currentYearSnapshots.length - 1].amountValue;

        // Metric A: Market Return (The Strategy)
        // Formula: (CurrentValue - (StartValue + NetContributions)) / (StartValue + NetContributions)
        const netContributions = currentYearSnapshots.slice(1).reduce((sum, s) => sum + (s.netContribution || 0), 0);
        const totalInvested = initialAmount + netContributions;

        let marketReturn = null;
        if (totalInvested !== 0) {
            const totalGain = currentAmount - totalInvested;
            marketReturn = (totalGain / totalInvested) * 100;
        }

        // Metric B: Total Growth (The Wealth)
        // Formula: (CurrentValue - StartValue) / StartValue
        let totalGrowth = null;
        if (initialAmount !== 0) {
            totalGrowth = ((currentAmount - initialAmount) / initialAmount) * 100;
        } else {
            // Handle division by zero (New Account)
            // If initial is 0 and we have growth, it's technically infinite or undefined, 
            // but for UI we might want to show something else or just handle it.
            // If current > 0, it's 100%? No, that's not right.
            // Let's return null or a special value if initial is 0.
            // The requirement says: "Ensure that if StartValue is 0 (new account), the Total Growth handles the division by zero gracefully (e.g., show "New")."
            totalGrowth = 'New';
        }

        return {
            marketReturn,
            totalGrowth,
            currentValue: currentAmount
        };
    };

    const { marketReturn, totalGrowth, currentValue } = calculateMetrics(account.snapshots);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {account.name}
                </CardTitle>
                <span className="text-xs text-muted-foreground">{account.category?.name}</span>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${currentValue.toLocaleString()}</div>

                <div className="mt-2 flex flex-col gap-1">
                    {/* Primary Badge: Market Return */}
                    <div className="flex items-center gap-2" title="Profit generated solely by investment gains.">
                        <span className="text-xs text-muted-foreground font-medium">Market Rtn:</span>
                        <span
                            className={`text-sm font-bold ${marketReturn === null
                                    ? 'text-muted-foreground'
                                    : marketReturn >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}
                        >
                            {marketReturn === null ? '--' : `${marketReturn.toFixed(1)}%`}
                        </span>
                    </div>

                    {/* Secondary Metric: Total Growth */}
                    <div className="flex items-center gap-2" title="Total increase in account value including your contributions.">
                        <span className="text-xs text-muted-foreground">Total Growth:</span>
                        <span className="text-xs text-muted-foreground">
                            {totalGrowth === 'New'
                                ? 'New'
                                : totalGrowth === null
                                    ? '--'
                                    : `${(totalGrowth as number).toFixed(1)}%`
                            }
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
