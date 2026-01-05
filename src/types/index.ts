export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    profileImage?: string;
}

export interface Taker {
    user: User;
    amount: number;
}

export interface Expense {
    _id: string;
    date: string;
    amount: number;
    category: 'Food' | 'Transport' | 'Rent' | 'Utility' | 'Others';
    reason: string;
    giver: User;
    takers: Taker[];
    splitType: 'equal' | 'custom';
    createdBy: User;
    createdAt: string;
    updatedAt: string;
}

export interface Income {
    _id: string;
    date: string;
    amount: number;
    givenBy: User;
    note: string;
    createdBy: User;
    createdAt: string;
    updatedAt: string;
}

export interface Summary {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
}

export interface CategoryBreakdown {
    _id: string;
    total: number;
    count: number;
}

export interface UserBreakdown {
    _id: string;
    userName: string;
    total: number;
    count: number;
}

export interface Due {
    from: User;
    to: User;
    amount: number;
}

export interface DuesData {
    month: number;
    year: number;
    dues: Due[];
    users: User[];
}

export interface UserBalanceSummary {
    user: User;
    owes: number;
    owed: number;
    net: number;
}

export interface DuesSummary {
    month: number;
    year: number;
    summary: UserBalanceSummary[];
}
