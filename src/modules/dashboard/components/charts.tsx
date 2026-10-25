"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Cores validadas para daltonismo e contraste (ver --color-chart-* em globals.css).
const CHART_1 = "var(--color-chart-1)";
const CHART_2 = "var(--color-chart-2)";
const AXIS = { fontSize: 11, fill: "var(--color-subtle-foreground)" };

function shortDay(day: string) {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: "1px solid var(--color-border)",
    fontSize: 13,
    padding: "8px 12px",
    boxShadow: "var(--shadow-overlay)",
  },
  labelStyle: { color: "var(--color-foreground)", fontWeight: 600 },
  cursor: { fill: "var(--color-muted)" },
};

export function TaskSeriesChart({ data }: { data: { day: string; scheduled: number; completed: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Tarefas agendadas e concluídas por dia">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis dataKey="day" tickFormatter={shortDay} tick={AXIS} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={40} />
          <Tooltip {...tooltipStyle} labelFormatter={(label) => shortDay(String(label))} />
          <Bar dataKey="scheduled" name="Agendadas" fill={CHART_2} radius={[3, 3, 0, 0]} maxBarSize={24} />
          <Bar dataKey="completed" name="Concluídas" fill={CHART_1} radius={[3, 3, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const euros = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

export function ExpenseSeriesChart({ data }: { data: { day: string; amountCents: number }[] }) {
  const points = data.map((point) => ({ day: point.day, amount: point.amountCents / 100 }));
  return (
    <div className="h-56 w-full" role="img" aria-label="Despesas por dia">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis dataKey="day" tickFormatter={shortDay} tick={AXIS} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => `${value} €`}
          />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(label) => shortDay(String(label))}
            formatter={(value) => [euros.format(Number(value)), "Despesas"]}
          />
          <Bar dataKey="amount" name="Despesas" fill={CHART_1} radius={[3, 3, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
