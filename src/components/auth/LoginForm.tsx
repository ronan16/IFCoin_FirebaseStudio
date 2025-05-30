
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
import { auth, db } from "@/lib/firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
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
    console.log("Login Submitted:", values);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole = 'student'; // Default role
      if (userDocSnap.exists()) {
        userRole = userDocSnap.data()?.role || 'student';
      } else {
        if (values.email === 'admin@admin.com') {
            userRole = 'admin';
        }
        console.warn("User document not found in Firestore for UID:", user.uid);
      }
      
      if (values.email === 'admin@admin.com' && values.password === 'admin') {
        userRole = 'admin'; 
      }


      let redirectPath = '/dashboard';
      if (userRole === 'admin') {
        redirectPath = '/dashboard/admin';
        toast({
          title: "Login de Administrador bem-sucedido!",
          description: "Redirecionando para o painel administrativo...",
          variant: "default",
        });
      } else if (userRole === 'teacher' || userRole === 'staff') { // Added staff role
        redirectPath = '/dashboard/teacher';
         toast({
          title: `Login de ${userRole === 'teacher' ? 'Professor' : 'Servidor'} bem-sucedido!`,
          description: `Redirecionando para o painel de ${userRole === 'teacher' ? 'professor' : 'servidor'}...`,
          variant: "default",
        });
      }
      else { // Student
        toast({
          title: "Login bem-sucedido!",
          description: "Redirecionando para o painel do aluno...",
          variant: "default",
        });
      }
      
      router.push(redirectPath);

    } catch (error: any) {
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        console.warn(`Login attempt failed (${error.code}): ${error.message}`);
        toast({
          title: "Erro no Login",
          description: "Email ou senha inválidos.",
          variant: "destructive",
        });
      } else {
        console.error("Login failed with unexpected error:", error);
        toast({
          title: "Erro no Login",
          description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
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
