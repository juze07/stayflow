import { z } from "@/lib/zod";
import { ISSUE_CATEGORIES } from "@/modules/maintenance/constants";

export const reportIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Descreva o problema em poucas palavras." })
    .max(160, { message: "Máximo de 160 caracteres." }),
  description: z.string().trim().max(4000, { message: "Máximo de 4000 caracteres." }),
  category: z.enum(ISSUE_CATEGORIES, { message: "Escolha uma categoria." }),
});
export type ReportIssueInput = z.input<typeof reportIssueSchema>;

export const reportPaymentSchema = z.object({
  reference: z.string().trim().max(200, { message: "Máximo de 200 caracteres." }),
});
export type ReportPaymentInput = z.input<typeof reportPaymentSchema>;
