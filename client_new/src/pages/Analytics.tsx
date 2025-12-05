import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, ReferenceLine, Cell, PieChart, Pie
} from 'recharts';

interface NetWorthPoint {
    month: string;
    totalValue: number;
    totalInvested: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Analytics() {
    const [netWorthData, setNetWorthData] = useState<NetWorthPoint[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [monthlyPerformance, setMonthlyPerformance] = useState<any[]>([]);
    const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [netWorthRes, categoryRes, monthlyRes, catPerfRes] = await Promise.all([
                api.get('/analytics/networth'),
                api.get('/analytics/categories'),
                api.get('/analytics/performance/monthly'),
                api.get('/analytics/performance/categories')
            ]);

            // Format date for display
            const formattedNetWorth = netWorthRes.map((d: any) => ({
                ...d,
                month: new Date(d.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            }));

            const formattedMonthly = monthlyRes.map((d: any) => ({
                ...d,
                month: new Date(d.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            }));

            setNetWorthData(formattedNetWorth);
            setCategoryData(categoryRes);
            setMonthlyPerformance(formattedMonthly);
            setCategoryPerformance(catPerfRes);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Portfolio Performance Over Time */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Portfolio Performance Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={netWorthData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(value)} />
                                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
                                    <Legend />
                                    <Line type="monotone" dataKey="totalValue" name="Total Value" stroke="#2563eb" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="totalInvested" name="Total Invested" stroke="#9333ea" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Contributions vs Growth */}
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>Monthly Contributions vs Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyPerformance} stackOffset="sign">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(value)} />
                                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
                                    <Legend />
                                    <ReferenceLine y={0} stroke="#000" />
                                    <Bar dataKey="netContribution" name="Net Contribution" fill="#2563eb" stackId="stack" />
                                    <Bar dataKey="marketReturn" name="Market Return" fill="#16a34a" stackId="stack" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Asset Allocation by Category */}
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader>
                        <CardTitle>Asset Allocation by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="totalValue"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Performance Comparison */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Category Performance (All Time Return %)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryPerformance} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" unit="%" />
                                    <YAxis dataKey="category" type="category" width={100} />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                                    <Bar dataKey="returnPercentage" name="Return %" fill="#8884d8">
                                        {categoryPerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.returnPercentage >= 0 ? '#16a34a' : '#dc2626'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
