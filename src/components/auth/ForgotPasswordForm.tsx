"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Schema definition for the forgot password form
const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  ra: z.string().regex(/^\d+$/, { message: "RA deve conter apenas números." }).min(5, { message: "RA deve ter pelo menos 5 dígitos." }), // Basic RA validation (adjust regex/length as needed)
});

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      ra: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    console.log("Forgot Password Submitted:", values);

    try {
      // Simulate API call to request password reset
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO: Implement actual API call to backend to verify email/RA and send reset link

      toast({
        title: "Verifique seu Email",
        description: "Se o email e RA estiverem corretos, você receberá um link para redefinir sua senha.",
        variant: "default",
      });
      setIsSuccess(true); // Show success message instead of form

    } catch (error: any) {
      console.error("Password reset request failed:", error);
      // Handle potential errors (e.g., user not found, rate limiting)
      toast({
        title: "Erro ao Solicitar Redefinição",
        description: "Não foi possível processar sua solicitação. Verifique os dados ou tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // If submission was successful, show a confirmation message
  if (isSuccess) {
    return (
        <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-primary">Solicitação Enviada!</p>
            <p className="text-sm text-muted-foreground">
                 Um email com as instruções para redefinição de senha foi enviado para o endereço informado (se ele estiver cadastrado e vinculado ao RA).
            </p>
             <Button variant="link" asChild>
                <a href="/">Voltar para Login</a>
             </Button>
        </div>
    );
  }

  // Render the form
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Institucional</FormLabel>
              <FormControl>
                <Input placeholder="seuemail@ifpr.edu.br" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ra"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RA (Registro Acadêmico)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Seu número de RA" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Instruções"
          )}
        </Button>
      </form>
    </Form>
  );
}
