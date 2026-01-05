'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { CategoryBreakdown, UserBreakdown } from '@/types';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig,
} from '@/components/ui/chart';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

interface CategoryPieChartProps {
    data: CategoryBreakdown[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    const chartData = data.map((item, index) => ({
        name: item._id,
        value: item.total,
        fill: COLORS[index % COLORS.length],
    }));

    const chartConfig = {
        value: {
            label: "Amount",
        },
    } satisfies ChartConfig;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Expenses by Category
            </h3>
            <div className="h-64">
                {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="w-full h-full">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                        </PieChart>
                    </ChartContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
}

interface UserBarChartProps {
    data: UserBreakdown[];
    title?: string;
    color?: string;
}

export function UserBarChart({ data, title = 'Expenses by User', color = '#3B82F6' }: UserBarChartProps) {
    const chartData = data.map((item) => ({
        name: item.userName,
        amount: item.total,
        fill: color,
    }));

    const chartConfig = {
        amount: {
            label: "Amount",
        },
    } satisfies ChartConfig;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {title}
            </h3>
            <div className="h-64">
                {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="w-full h-full">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
                            <XAxis type="number" tickFormatter={(value) => `৳${value.toLocaleString()}`} hide />
                            <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Bar dataKey="amount" radius={4} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No data available
                    </div>
                )}
            </div>
        </div>
    );
}
