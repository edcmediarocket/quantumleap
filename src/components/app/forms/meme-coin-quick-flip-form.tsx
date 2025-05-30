
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
import { Rocket, AlertTriangle } from "lucide-react";
import type { MemeCoinQuickFlipInput } from "@/ai/flows/meme-coin-quick-flip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


const formSchema = z.object({
  // Meme coin hunting is often about immediate opportunities, so specific inputs might be minimal.
  // We'll add a mandatory risk confirmation checkbox.
  confirmRisk: z.boolean().refine(val => val === true, {
    message: "You must acknowledge the extreme risks of meme coin trading.",
  }),
  trigger: z.boolean().optional().default(true), // Hidden field to trigger flow
});

type MemeCoinQuickFlipFormValues = z.infer<typeof formSchema>;

interface MemeCoinQuickFlipFormProps {
  onSubmit: (data: MemeCoinQuickFlipInput) => Promise<void>;
  isLoading: boolean;
}

export function MemeCoinQuickFlipForm({ onSubmit, isLoading }: MemeCoinQuickFlipFormProps) {
  const form = useForm<MemeCoinQuickFlipFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      confirmRisk: false,
      trigger: true,
    },
  });

  const handleSubmit = async (values: MemeCoinQuickFlipFormValues) => {
    // Ensure the input to the flow matches MemeCoinQuickFlipInputSchema
    await onSubmit({ trigger: values.trigger || true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="confirmRisk"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-destructive/50 p-4 bg-destructive/10">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground mt-[2px]" // Nudged down slightly
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel htmlFor="confirmRisk" className="text-destructive flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" /> I Acknowledge Extreme Risks
                </FormLabel>
                <p className="text-xs text-destructive/80">
                  Meme coins are highly volatile and speculative. You could lose your entire investment. This is not financial advice.
                </p>
                <FormMessage className="text-destructive" />
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white" disabled={isLoading || !form.watch("confirmRisk")}>
          {isLoading ? "Hunting Memes..." : <><Rocket className="mr-2 h-4 w-4" /> Find Quick Flip Memes</>}
        </Button>
      </form>
    </Form>
  );
}

    