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
import { Loader2 } from "lucide-react"; // Import Loader2 for loading state
import Link from 'next/link'; // Import Link for navigation
// import { signInWithEmailAndPassword } from "firebase/auth"; // Import Firebase Auth function
// import { auth } from "@/lib/firebase/firebase"; // Import Firebase auth instance (adjust path if needed)

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  // const router = useRouter(); // If using Next.js router

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
      // --- Firebase Authentication Logic (Example) ---
      // const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      // const user = userCredential.user;
      // console.log("User logged in:", user);

      // Simulate API call & role-based redirect
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      toast({
        title: "Login bem-sucedido!",
        description: "Redirecionando para o painel...",
        variant: "default", // Use 'default' or 'success' if defined
      });

      // TODO: Fetch user role from backend/database after successful login
      const userRole = 'student'; // Placeholder - Replace with actual role fetching

      // Redirect based on role (adjust paths as needed)
      if (userRole === 'admin') {
         // window.location.href = '/admin/dashboard'; // Or use Next.js router
         console.log("Redirecting to Admin Dashboard");
      } else if (userRole === 'teacher' || userRole === 'staff') {
         // window.location.href = '/teacher/dashboard';
         console.log("Redirecting to Teacher Dashboard");
      } else {
         // window.location.href = '/student/dashboard';
         console.log("Redirecting to Student Dashboard");
      }
       // Example: Redirect to a generic dashboard for now
       window.location.href = '/dashboard';


    } catch (error: any) {
      console.error("Login failed:", error);
      // let errorMessage = "Falha no login. Verifique suas credenciais.";
      // // Handle specific Firebase errors (optional)
      // if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      //   errorMessage = "Email ou senha inválidos.";
      // } else if (error.code === 'auth/too-many-requests') {
      //    errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
      // }

      toast({
        title: "Erro no Login",
        description: "Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.", // Use generic message for now
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
