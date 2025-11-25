export interface MonthlySnapshot {
    id: number;
    accountId: number;
    month: string;
    amountValue: number;
}

export interface Category {
    id: number;
    name: string;
}

export interface Account {
    id: number;
    name: string;
    categoryId: number;
    category?: Category;
    initialAmount: number;
    currentValue?: number;
    snapshots?: MonthlySnapshot[];
}

export interface GlobalGoal {
    id: number;
    year: number;
    targetAmount: number;
}
