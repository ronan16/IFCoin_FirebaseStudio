import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4">
            {/* Placeholder for Logo - Consider adding an SVG or Image */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-16 w-16 mx-auto text-primary">
                <circle cx="50" cy="50" r="45" fill="currentColor" />
                <text x="50" y="60" fontSize="30" fill="hsl(var(--primary-foreground))" textAnchor="middle" fontWeight="bold">IF</text>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">IFCoins Digital</CardTitle>
          <CardDescription>Faça login para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <Separator className="my-6" />
          <Button variant="outline" className="w-full" asChild>
            <Link href="/register">Criar Nova Conta</Link>
          </Button>
        </CardContent>
      </Card>
      <footer className="mt-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} IFPR - Instituto Federal do Paraná
      </footer>
    </main>
  );
}
