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
import { Target, Zap } from "lucide-react";
import type { AiCoinPicksInput } from "@/ai/flows/ai-coin-picks";

const formSchema = z.object({
  profitTarget: z.coerce.number().positive({ message: "Profit target must be positive." }),
  strategy: z.enum(["short-term", "swing", "scalp"]),
});

type AiCoinPicksFormValues = z.infer<typeof formSchema>;

interface AiCoinPicksFormProps {
  onSubmit: (data: AiCoinPicksInput) => Promise<void>;
  isLoading: boolean;
}

export function AiCoinPicksForm({ onSubmit, isLoading }: AiCoinPicksFormProps) {
  const form = useForm<AiCoinPicksFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profitTarget: 100,
      strategy: "short-term",
    },
  });

  const handleSubmit = async (values: AiCoinPicksFormValues) => {
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
                <Target className="mr-2 h-4 w-4 text-primary" />
                Profit Target (USD)
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="strategy"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Zap className="mr-2 h-4 w-4 text-primary" />
                Trading Strategy
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="short-term">Short-term</SelectItem>
                  <SelectItem value="swing">Swing</SelectItem>
                  <SelectItem value="scalp">Scalp</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Get AI Coin Picks"}
        </Button>
      </form>
    </Form>
  );
}
