
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle } from "lucide-react"; // Changed UploadCloud to UserCircle
import { auth, db, serverTimestamp } from "@/lib/firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
// Firebase Storage imports are no longer needed here
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import Image from 'next/image';

const coursesList = ["Informática", "Eletrotécnica", "Agroecologia", "Agropecuária", "Sistemas de Informação", "Eng. Agronômica", "Física"];
const turmasList = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "TEC1", "TEC2"];

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  ra: z.string().regex(/^[a-zA-Z0-9]+$/, { message: "RA deve conter apenas letras e números." }).min(5, { message: "RA deve ter pelo menos 5 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  course: z.string().min(1, { message: "Selecione um curso." }),
  turma: z.string().min(1, { message: "Selecione uma turma." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "A confirmação de senha deve ter pelo menos 6 caracteres." }),
  avatarUrl: z.string().url({ message: "Por favor, insira uma URL válida para o avatar ou deixe em branco." }).optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null); // Still useful for URL preview

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      ra: "",
      email: "",
      course: "",
      turma: "",
      password: "",
      confirmPassword: "",
      avatarUrl: "",
    },
  });

  const avatarUrlValue = form.watch("avatarUrl");
  React.useEffect(() => {
    if (avatarUrlValue && avatarUrlValue.startsWith('http')) {
      setAvatarPreview(avatarUrlValue);
    } else {
      setAvatarPreview(null);
    }
  }, [avatarUrlValue]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // No file upload, just use the provided URL
      const finalAvatarUrl = values.avatarUrl || ""; // Use provided URL or empty string

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: values.name,
        ra: values.ra,
        email: values.email,
        course: values.course,
        turma: values.turma,
        role: "student",
        createdAt: serverTimestamp(),
        coins: 0,
        cardsCollected: 0,
        avatarUrl: finalAvatarUrl, // Save the URL
      });

      toast({
        title: "Conta Criada com Sucesso!",
        description: "Você já pode fazer login.",
        variant: "default",
      });
      router.push("/");

    } catch (error: any) {
      console.error("Registration failed:", error);
      let errorMessage = "Ocorreu um erro ao criar a conta. Tente novamente.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso. Tente outro.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha é muito fraca. Por favor, escolha uma senha mais forte.";
      }
      toast({
        title: "Erro ao Criar Conta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Foto de Perfil (Opcional)</FormLabel>
              <FormControl>
                 <div className="flex items-center gap-4">
                    {avatarPreview ? (
                        <Image src={avatarPreview} alt="Prévia do Avatar" width={64} height={64} className="rounded-full object-cover h-16 w-16" data-ai-hint="user avatar" />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <UserCircle size={32} />
                        </div>
                    )}
                    <Input 
                        type="url" 
                        placeholder="https://exemplo.com/avatar.png"
                        {...field}
                        disabled={isLoading}
                        className="block w-full"
                    />
                </div>
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
                <Input type="text" placeholder="Seu número de RA (Ex: 20251IVA10030013)" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="course"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Curso</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu curso" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {coursesList.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="turma"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Turma</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sua turma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {turmasList.map((turma) => (
                    <SelectItem key={turma} value={turma}>
                      {turma}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Senha</FormLabel>
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
              Registrando...
            </>
          ) : (
            "Criar Conta"
          )}
        </Button>
      </form>
    </Form>
  );
}
