import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
       <div className="absolute top-4 left-4">
         <Button variant="outline" size="sm" asChild>
           <Link href="/">
             <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
           </Link>
         </Button>
       </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Criar Nova Conta</CardTitle>
          <CardDescription>Preencha os campos para se registrar.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
       <footer className="mt-8 text-sm text-muted-foreground">
         © {new Date().getFullYear()} IFPR - Instituto Federal do Paraná
       </footer>
    </main>
  );
}
