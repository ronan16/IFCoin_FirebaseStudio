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
        // Fallback for users created before Firestore profile, or edge cases
        // For this app, we can keep the admin@admin.com check as a super-admin fallback
        // if Firestore profile doesn't exist (though it should for new users)
        if (values.email === 'admin@admin.com') {
            userRole = 'admin';
        }
        console.warn("User document not found in Firestore for UID:", user.uid);
      }
      
      // Specific hardcoded super-admin check - can be removed if all admins are via Firestore role
      if (values.email === 'admin@admin.com' && values.password === 'admin') {
        userRole = 'admin'; // Override if it's the hardcoded super admin
      }


      let redirectPath = '/dashboard';
      if (userRole === 'admin') {
        redirectPath = '/dashboard/admin';
        toast({
          title: "Login de Administrador bem-sucedido!",
          description: "Redirecionando para o painel administrativo...",
          variant: "default",
        });
      } else if (userRole === 'teacher') {
        redirectPath = '/dashboard/teacher';
         toast({
          title: "Login de Professor bem-sucedido!",
          description: "Redirecionando para o painel do professor...",
          variant: "default",
        });
      }
      else {
        toast({
          title: "Login bem-sucedido!",
          description: "Redirecionando para o painel do aluno...",
          variant: "default",
        });
      }
      
      router.push(redirectPath);

    } catch (error: any) {
      console.error("Login failed:", error);
      let errorMessage = "Email ou senha inválidos. Por favor, tente novamente.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Email ou senha inválidos.";
      }
      toast({
        title: "Erro no Login",
        description: errorMessage,
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
