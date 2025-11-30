import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Account, MonthlySnapshot } from '@/types';
import { calculateXIRR, CashFlow } from '@/lib/financial';

interface AccountCardProps {
    account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
    const calculateMetrics = (snapshots?: MonthlySnapshot[]) => {
        if (!snapshots || snapshots.length === 0) {
            return {
                mwr: null,
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
                mwr: null,
                totalGrowth: null,
                currentValue: account.initialAmount
            };
        }

        const initialAmount = currentYearSnapshots[0].amountValue;
        const currentAmount = currentYearSnapshots[currentYearSnapshots.length - 1].amountValue;

        // Metric A: MWR / IRR (Money-Weighted Rate of Return)
        const cashFlows: CashFlow[] = [];

        // 1. Initial Investment (Start of Year)
        // We assume the start value is an "inflow" to the portfolio at the beginning, 
        // effectively a negative cash flow from the investor's perspective if we treat the portfolio as the investment.
        // Wait, standard XIRR:
        // Investments are negative (outflows from pocket).
        // Returns/Final Value are positive (inflows to pocket).

        // Initial Balance is treated as an initial investment (negative).
        // If it's the very first snapshot of the year, we treat the amount BEFORE this month's activity as the start?
        // Or just take the first snapshot's amount as the starting point?
        // Let's assume the first snapshot represents the state at that time.
        // Ideally, we'd have a "start of year" balance.
        // Let's use the first snapshot's date and amount as the initial investment.
        // BUT, if the first snapshot includes a contribution, we need to be careful.
        // Let's simplify: 
        // Initial "Investment" = Amount at start.
        // For the first snapshot, let's assume the 'amountValue' is the balance.
        // If we want XIRR for the *period*, we treat the start balance as a negative cash flow.

        // However, we also have 'netContribution' in each snapshot.
        // If we use the start balance, we shouldn't double count the contribution of the first month if it's included in that balance?
        // Actually, 'amountValue' is the ending balance of that month.
        // So the "Start Value" for the period would be (AmountValue - NetContribution - InvestmentReturns) of the first month?
        // Or simpler: The previous month's balance.
        // Since we don't have previous month easily here, let's approximate:
        // Start Value = First Snapshot Amount - First Snapshot Net Contribution (roughly, ignoring 1 month gain).
        // Better yet, if we treat the first snapshot as "Month 1", the investment happened at Month 1?

        // Let's try this approach for Cash Flows:
        // 1. Initial Balance (Negative) at Start Date.
        //    Let's use (FirstSnapshot.Amount - FirstSnapshot.NetContribution) as the "Start Balance".
        //    Date: FirstSnapshot.Date

        // 2. Contributions (Negative) at each Snapshot Date.
        //    For each snapshot (including the first one), we have a NetContribution.
        //    If NetContribution > 0, it's an investment (Negative Cash Flow).
        //    If NetContribution < 0, it's a withdrawal (Positive Cash Flow).

        // 3. Final Value (Positive) at End Date.
        //    LastSnapshot.AmountValue.

        // Let's refine the Start Balance.
        // If we start at Jan 1st, and the first snapshot is Jan 31st.
        // The "Start Balance" is effectively 0 if it's a new account, or the carry over.
        // If we use the logic:
        // Cash Flow 0: -(FirstSnapshot.Amount - FirstSnapshot.NetContribution) at FirstSnapshot.Date (approx).
        // Cash Flow 1..N: -(NetContribution) at Snapshot.Date
        // Cash Flow Final: +(LastSnapshot.Amount) at LastSnapshot.Date

        // Example:
        // Jan: Balance 1000, Contrib 100. (Start was 900 + gain).
        // CF0: -900 (Start)
        // CF1: -100 (Contrib)
        // Final: +1000
        // Net: 0 gain? No, if 900+100=1000, gain is 0. XIRR should be 0. Correct.

        // Example 2:
        // Jan: Balance 1100, Contrib 100. (Start 900, Gain 100).
        // CF0: -900
        // CF1: -100
        // Final: +1100
        // Gain 100 on 1000 invested. 10%.

        const firstSnapshot = currentYearSnapshots[0];
        const startBalance = firstSnapshot.amountValue - (firstSnapshot.netContribution || 0);

        // If startBalance is > 0, treat it as an initial investment.
        if (startBalance > 0) {
            cashFlows.push({
                amount: -startBalance,
                date: new Date(firstSnapshot.month) // Approximation: treating start balance as invested at month end? 
                // Ideally should be month start, but we only have one date. 
                // Let's stick to snapshot date for consistency.
            });
        }

        // Add contributions for all snapshots
        currentYearSnapshots.forEach(s => {
            if (s.netContribution && s.netContribution !== 0) {
                // Contribution is outflow (negative), Withdrawal is inflow (positive)
                // Our data: NetContribution > 0 is deposit.
                cashFlows.push({
                    amount: -s.netContribution,
                    date: new Date(s.month)
                });
            }
        });

        // Add Final Value
        const lastSnapshot = currentYearSnapshots[currentYearSnapshots.length - 1];
        cashFlows.push({
            amount: lastSnapshot.amountValue,
            date: new Date(lastSnapshot.month)
        });

        const mwr = calculateXIRR(cashFlows);

        // Metric B: Total Growth (The Wealth)
        // Formula: (CurrentValue - StartValue) / StartValue
        let totalGrowth = null;
        if (initialAmount !== 0) {
            totalGrowth = ((currentAmount - initialAmount) / initialAmount) * 100;
        } else {
            totalGrowth = 'New';
        }

        return {
            mwr,
            totalGrowth,
            currentValue: currentAmount
        };
    };

    const { mwr, totalGrowth, currentValue } = calculateMetrics(account.snapshots);

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
                    {/* Primary Badge: MWR / IRR */}
                    <div className="flex items-center gap-2" title="Money-Weighted Rate of Return (Internal Rate of Return). Takes into account the timing and size of your contributions.">
                        <span className="text-xs text-muted-foreground font-medium">MWR / IRR:</span>
                        <span
                            className={`text-sm font-bold ${mwr === null
                                ? 'text-muted-foreground'
                                : mwr >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                        >
                            {mwr === null ? '--' : `${mwr.toFixed(1)}%`}
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
