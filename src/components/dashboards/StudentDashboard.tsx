// src/components/dashboards/StudentDashboard.tsx
"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react'; // Import React
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge"; // Make sure Badge is imported
import { Award, Coins, History, Repeat, ShoppingBag, Users, Star, Loader2, CalendarDays, Gift } from "lucide-react";
import Image from 'next/image';
import { auth, db } from '@/lib/firebase/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where, Timestamp, getDocs, limit } from 'firebase/firestore';

interface StudentProfile {
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    avatarUrl?: string;
    initials: string;
    coins: number;
    cardsCollected: number; // Unique cards
    uid: string;
}

interface CardData {
    id: string;
    name: string;
    rarity: "Comum" | "Raro" | "Lendário" | "Mítico";
    imageUrl: string;
}

interface EventData {
    id: string;
    name: string;
    startDate: Timestamp;
    endDate: Timestamp;
    bonusMultiplier: number;
    description?: string; // Optional, based on your events structure
    imageUrl?: string; // Optional
}


export function StudentDashboard() {
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [totalSystemCards, setTotalSystemCards] = useState<number>(0);
    const [featuredCard, setFeaturedCard] = useState<CardData | null>(null);
    const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingExtra, setIsLoadingExtra] = useState(true); // For featured card & event

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
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
                            cardsCollected: data.cardsCollected || 0,
                            avatarUrl: data.avatarUrl,
                        });
                    } else {
                        console.warn("User document not found in Firestore for student dashboard.");
                    }
                    setIsLoading(false); // User profile loading done
                }, (error) => {
                    console.error("Error fetching student profile:", error);
                    setIsLoading(false);
                });
                return () => unsubscribeSnapshot();
            } else {
                setIsLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        // Fetch total system cards, featured card, and current event
        const fetchExtraData = async () => {
            setIsLoadingExtra(true);
            try {
                // Total System Cards
                const cardsCollectionRef = collection(db, "cards");
                const cardsSnapshot = await getDocs(cardsCollectionRef);
                setTotalSystemCards(cardsSnapshot.size);

                // Featured Card (try to get a Legendary or Mythic)
                const featuredQuery = query(cardsCollectionRef, where("rarity", "in", ["Lendário", "Mítico"]), limit(1));
                const featuredSnapshot = await getDocs(featuredQuery);
                if (!featuredSnapshot.empty) {
                    setFeaturedCard({ id: featuredSnapshot.docs[0].id, ...featuredSnapshot.docs[0].data() } as CardData);
                } else {
                    // Fallback: get any card if no Legendary/Mythic
                    const anyCardQuery = query(cardsCollectionRef, limit(1));
                    const anyCardSnapshot = await getDocs(anyCardQuery);
                    if (!anyCardSnapshot.empty) {
                        setFeaturedCard({ id: anyCardSnapshot.docs[0].id, ...anyCardSnapshot.docs[0].data() } as CardData);
                    }
                }

                // Current Event
                const now = Timestamp.now();
                const eventsCollectionRef = collection(db, "events");
                const activeEventQuery = query(
                    eventsCollectionRef,
                    where("startDate", "<=", now),
                    orderBy("startDate", "desc"), // In case of overlap, pick most recent start
                    limit(1) // We only want one active event displayed
                );
                const activeEventSnapshot = await getDocs(activeEventQuery);
                
                activeEventSnapshot.forEach(docSnap => {
                    const event = { id: docSnap.id, ...docSnap.data() } as EventData;
                    if (event.endDate >= now) { // Check if end date is also valid
                        setCurrentEvent(event);
                    }
                });

            } catch (error) {
                console.error("Error fetching extra dashboard data:", error);
            } finally {
                setIsLoadingExtra(false);
            }
        };

        fetchExtraData();
    }, []);


    if (isLoading || !studentProfile) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-2">Carregando perfil...</p>
            </div>
        );
    }

    const collectionProgress = totalSystemCards > 0 ? Math.round((studentProfile.cardsCollected / totalSystemCards) * 100) : 0;

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
                        {isLoadingExtra ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                <div className="text-2xl font-bold">{studentProfile.cardsCollected} / {totalSystemCards}</div>
                                <Progress value={collectionProgress} className="mt-2 h-2" />
                                <p className="text-xs text-muted-foreground mt-1">{collectionProgress}% completa</p>
                            </>
                        )}
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
                        <CalendarDays className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingExtra ? <Loader2 className="h-4 w-4 animate-spin" /> : currentEvent ? (
                            <>
                                <div className="text-lg font-semibold">{currentEvent.name}</div>
                                <p className="text-xs text-muted-foreground">Ganhe {currentEvent.bonusMultiplier}x mais IFCoins!</p>
                                <p className="text-xs text-muted-foreground">Termina em: {currentEvent.endDate.toDate().toLocaleDateString('pt-BR')}</p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum evento ativo no momento.</p>
                        )}
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
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <History className="h-5 w-5" /> Atividade Recente
                        </CardTitle>
                        <CardDescription>Suas últimas ações no IFCoins</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder for now */}
                        <p className="text-sm text-muted-foreground">Histórico de atividades em breve.</p>
                        {/* 
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
                        */}
                    </CardContent>
                </Card>

                <Card className="shadow-sm flex flex-col items-center text-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-1"><Gift className="h-5 w-5" /> Carta em Destaque</CardTitle>
                         {isLoadingExtra ? <Loader2 className="h-4 w-4 animate-spin my-2" /> : featuredCard ? (
                            <Badge variant="secondary" className="mt-1 capitalize bg-yellow-200 text-yellow-800 border-yellow-300">{featuredCard.rarity}</Badge>
                         ) : null}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center">
                        {isLoadingExtra ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : featuredCard ? (
                            <>
                                <Image
                                    src={featuredCard.imageUrl}
                                    alt={featuredCard.name}
                                    width={150}
                                    height={210}
                                    className="rounded-lg shadow-lg border-4 border-white mb-4 transform hover:scale-105 transition-transform duration-300"
                                    data-ai-hint="featured trading card"
                                 />
                                <p className="font-semibold">{featuredCard.name}</p>
                            </>
                        ) : (
                            <>
                                <Image
                                    src={"https://placehold.co/150x210.png"}
                                    alt="Carta Padrão"
                                    width={150}
                                    height={210}
                                    className="rounded-lg shadow-lg border-4 border-white mb-4"
                                    data-ai-hint="placeholder card"
                                />
                                <p className="font-semibold">Descubra Novas Cartas!</p>
                            </>
                        )}
                    </CardContent>
                     <CardFooter className="flex-col items-center gap-2 w-full">
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
