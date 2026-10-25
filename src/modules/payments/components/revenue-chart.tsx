"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Cores validadas para daltonismo e contraste (ver --color-chart-* em globals.css).
const AXIS = { fontSize: 11, fill: "var(--color-subtle-foreground)" };
const euros = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

type Point = { label: string; revenueCents: number; expenseCents: number };

/** Receitas e despesas lado a lado, por mês. */
export function RevenueExpenseChart({ data }: { data: Point[] }) {
  const points = data.map((point) => ({
    label: point.label,
    revenue: point.revenueCents / 100,
    expense: point.expenseCents / 100,
  }));
  return (
    <div className="h-64 w-full" role="img" aria-label="Receitas e despesas por mês">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={8} />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(value: number) => `${value} €`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              fontSize: 13,
              padding: "8px 12px",
              boxShadow: "var(--shadow-overlay)",
            }}
            labelStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
            cursor={{ fill: "var(--color-muted)" }}
            formatter={(value, name) => [euros.format(Number(value)), name]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 13 }}
            formatter={(value) => <span style={{ color: "var(--color-foreground)" }}>{value}</span>}
          />
          <Bar dataKey="revenue" name="Receitas" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Despesas" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
