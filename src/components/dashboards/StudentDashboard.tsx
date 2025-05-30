// src/components/dashboards/StudentDashboard.tsx
"use client";

import Link from 'next/link';
import React from 'react'; // Import React
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Coins, History, Repeat, ShoppingBag, Users, Star, Loader2 } from "lucide-react";
import Image from 'next/image';
import { auth, db } from '@/lib/firebase/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface StudentProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    avatarUrl?: string;
    initials: string;
    coins: number;
    cardsCollected: number; // Unique cards
    totalCardsInSystem: number; // Total cards possible to collect in the system
    uid: string;
}

// Mock Data - To be replaced by Firestore data
const defaultStudentData = {
    recentActivity: [
        { type: "reward", description: "Ganhou 10 IFCoins por participação.", time: "2h atrás", icon: <Award className="h-4 w-4 text-yellow-500" /> },
        { type: "trade", description: "Troca concluída com Maria.", time: "1 dia atrás", icon: <Repeat className="h-4 w-4 text-blue-500" /> },
        { type: "purchase", description: "Comprou Pacote Surpresa.", time: "3 dias atrás", icon: <ShoppingBag className="h-4 w-4 text-green-500" /> },
    ],
    featuredCard: {
        name: "Mascote IFPR Lendário",
        rarity: "Lendário",
        imageUrl: "https://picsum.photos/seed/mascote/200/280", // Placeholder
    },
    currentEvent: {
        name: "Semana da Tecnologia",
        bonusMultiplier: 1.5,
        endDate: "2024-12-31",
    }
};

export function StudentDashboard() {
    const [studentProfile, setStudentProfile] = React.useState<StudentProfile | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                // Listen for real-time updates to the user's profile
                const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setStudentProfile({
                            uid: user.uid,
                            name: data.name || "Aluno",
                            email: user.email || "",
                            role: data.role || "student",
                            initials: (data.name || "A").substring(0, 2).toUpperCase(),
                            coins: data.coins || 0,
                            cardsCollected: data.cardsCollected || 0, // Firestore field for unique cards
                            totalCardsInSystem: data.totalCardsInSystem || 100, // This could be a global config
                            avatarUrl: data.avatarUrl,
                        });
                    } else {
                        console.warn("User document not found in Firestore for student dashboard.");
                        // Potentially redirect or show error
                    }
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error fetching student profile:", error);
                    setIsLoading(false);
                });
                return () => unsubscribeSnapshot(); // Cleanup snapshot listener
            } else {
                setIsLoading(false);
                // User is signed out, DashboardLayout should handle redirect
            }
        });
        return () => unsubscribeAuth(); // Cleanup auth listener
    }, []);


    if (isLoading || !studentProfile) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const collectionProgress = Math.round((studentProfile.cardsCollected / studentProfile.totalCardsInSystem) * 100);

    return (
        <div className="container mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-primary">Bem-vindo, {studentProfile.name}!</h1>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo IFCoins</CardTitle>
                        <Coins className="h-5 w-5 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{studentProfile.coins}</div>
                        <p className="text-xs text-muted-foreground">Moedas para gastar na loja</p>
                    </CardContent>
                    <CardFooter>
                       <Button size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                          <Link href="/dashboard/shop">Ir para Loja</Link>
                       </Button>
                    </CardFooter>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Coleção</CardTitle>
                        <Award className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{studentProfile.cardsCollected} / {studentProfile.totalCardsInSystem}</div>
                        <Progress value={collectionProgress} className="mt-2 h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{collectionProgress}% completa</p>
                    </CardContent>
                    <CardFooter>
                       <Button size="sm" variant="outline" asChild>
                          <Link href="/dashboard/collection">Ver Coleção</Link>
                       </Button>
                    </CardFooter>
                </Card>
                 <Card className="shadow-sm hover:shadow-md transition-shadow bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Evento Ativo</CardTitle>
                        <Star className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {/* Replace with dynamic event data if available */}
                        <div className="text-lg font-semibold">{defaultStudentData.currentEvent.name}</div>
                        <p className="text-xs text-muted-foreground">Ganhe {defaultStudentData.currentEvent.bonusMultiplier}x mais IFCoins!</p>
                        <p className="text-xs text-muted-foreground">Termina em: {new Date(defaultStudentData.currentEvent.endDate).toLocaleDateString('pt-BR')}</p>
                    </CardContent>
                    <CardFooter>
                       <Button size="sm" variant="link" asChild className="text-primary p-0 h-auto">
                          <Link href="/dashboard/events">Ver Detalhes</Link>
                       </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activity - Replace with dynamic data */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <History className="h-5 w-5" /> Atividade Recente
                        </CardTitle>
                        <CardDescription>Suas últimas ações no IFCoins</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {defaultStudentData.recentActivity.map((activity, index) => (
                                <li key={index} className="flex items-center gap-4">
                                    <div className="p-2 bg-muted rounded-full">
                                        {activity.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">{activity.description}</p>
                                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                                    </div>
                                </li>
                            ))}
                             {defaultStudentData.recentActivity.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>}
                        </ul>
                    </CardContent>
                    {/* <CardFooter>
                        <Button variant="link" size="sm" className="text-primary">Ver tudo</Button>
                    </CardFooter> */}
                </Card>

                {/* Featured Card / Event - Replace with dynamic data */}
                <Card className="shadow-sm flex flex-col items-center text-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardHeader>
                        <CardTitle>Carta em Destaque</CardTitle>
                        <Badge variant="secondary" className="mt-1 capitalize bg-yellow-200 text-yellow-800 border-yellow-300">{defaultStudentData.featuredCard.rarity}</Badge>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center">
                        <Image
                            src={defaultStudentData.featuredCard.imageUrl}
                            alt={defaultStudentData.featuredCard.name}
                            width={150}
                            height={210}
                            className="rounded-lg shadow-lg border-4 border-white mb-4 transform hover:scale-105 transition-transform duration-300"
                         />
                        <p className="font-semibold">{defaultStudentData.featuredCard.name}</p>

                    </CardContent>
                     <CardFooter className="flex-col items-center gap-2">
                         <Button asChild className="w-full bg-primary hover:bg-primary/90">
                            <Link href="/dashboard/shop">Visitar Loja</Link>
                         </Button>
                         <Button variant="outline" asChild className="w-full">
                            <Link href="/dashboard/collection">Minha Coleção</Link>
                         </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Quick Links */}
            <Card className="shadow-sm">
                 <CardHeader>
                     <CardTitle>Acesso Rápido</CardTitle>
                 </CardHeader>
                 <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <Link href="/dashboard/shop" className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-accent/20 transition-colors">
                         <ShoppingBag className="h-8 w-8 mb-2 text-primary"/>
                         <span className="text-sm font-medium">Loja</span>
                     </Link>
                     <Link href="/dashboard/collection" className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-accent/20 transition-colors">
                         <Award className="h-8 w-8 mb-2 text-primary"/>
                         <span className="text-sm font-medium">Coleção</span>
                     </Link>
                     <Link href="/dashboard/trades" className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-accent/20 transition-colors">
                         <Repeat className="h-8 w-8 mb-2 text-primary"/>
                         <span className="text-sm font-medium">Trocas</span>
                     </Link>
                      <Link href="/dashboard/rankings" className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-accent/20 transition-colors">
                         <Users className="h-8 w-8 mb-2 text-primary"/>
                         <span className="text-sm font-medium">Rankings</span>
                     </Link>
                 </CardContent>
            </Card>
        </div>
    );
}
