"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, ShieldAlert } from "lucide-react";
import type { RecommendCoinsForProfitTargetInput } from "@/ai/flows/quick-profit-goal";

const formSchema = z.object({
  profitTarget: z.coerce.number().positive({ message: "Profit target must be positive." }),
  riskTolerance: z.enum(["low", "medium", "high"]),
});

type QuickProfitGoalFormValues = z.infer<typeof formSchema>;

interface QuickProfitGoalFormProps {
  onSubmit: (data: RecommendCoinsForProfitTargetInput) => Promise<void>;
  isLoading: boolean;
}

export function QuickProfitGoalForm({ onSubmit, isLoading }: QuickProfitGoalFormProps) {
  const form = useForm<QuickProfitGoalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profitTarget: 100,
      riskTolerance: "medium",
    },
  });

  const handleSubmit = async (values: QuickProfitGoalFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="profitTarget"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <BarChart className="mr-2 h-4 w-4 text-primary" />
                Desired Profit Target (USD)
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 200" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="riskTolerance"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <ShieldAlert className="mr-2 h-4 w-4 text-primary" />
                Risk Tolerance
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk tolerance" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
          {isLoading ? "Calculating..." : "Get Profit Goal Coins"}
        </Button>
      </form>
    </Form>
  );
}
