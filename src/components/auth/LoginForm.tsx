
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
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }), // Changed min length for simplicity of "admin" password
});

export function LoginForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    console.log("Form Submitted:", values);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      let userRole = 'student'; // Default role
      let redirectPath = '/dashboard';

      if (values.email === 'admin@admin.com' && values.password === 'admin') {
        userRole = 'admin';
        redirectPath = '/dashboard/admin';
        toast({
          title: "Login de Administrador bem-sucedido!",
          description: "Redirecionando para o painel administrativo...",
          variant: "default",
        });
      } else {
        // For any other login, treat as student
        // In a real app, you would validate credentials against a database
        toast({
          title: "Login bem-sucedido!",
          description: "Redirecionando para o painel do aluno...",
          variant: "default",
        });
      }

      // Store role in localStorage for layout to pick up (simple session simulation)
      // localStorage.setItem('userRole', userRole); // This is one way, but layout will use path

      window.location.href = redirectPath;

    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Erro no Login",
        description: "Email ou senha inválidos. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="seuemail@exemplo.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
         <div className="text-center text-sm mt-4">
            <Link href="/forgot-password" className="text-primary hover:underline">
                Esqueceu sua senha?
            </Link>
         </div>
      </form>
    </Form>
  );
}
