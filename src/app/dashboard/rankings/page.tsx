
// src/app/dashboard/rankings/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Coins, Gem, User, Loader2 } from "lucide-react"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { auth, db } from '@/lib/firebase/firebase'; 
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import NextImage from 'next/image'; // For Firebase Storage images

interface RankedUser {
    id: string;
    name: string;
    avatarUrl?: string;
    initials: string;
    coins: number;
    course: string;
    cardsCollected: number; 
}

export default function RankingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [topCoinHolders, setTopCoinHolders] = useState<RankedUser[]>([]);
    const [topCollectors, setTopCollectors] = useState<RankedUser[]>([]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        const fetchRankings = async () => {
            setIsLoading(true);
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("role", "==", "student"));
                const querySnapshot = await getDocs(q);
                
                const allStudents: RankedUser[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    allStudents.push({
                        id: doc.id,
                        name: data.name || "Aluno Desconhecido",
                        avatarUrl: data.avatarUrl,
                        initials: (data.name || "AD").substring(0, 2).toUpperCase(),
                        coins: data.coins || 0,
                        course: data.course || "Curso não informado",
                        cardsCollected: data.cardsCollected || 0,
                    });
                });

                const sortedByCoins = [...allStudents].sort((a, b) => b.coins - a.coins);
                setTopCoinHolders(sortedByCoins);

                const sortedByCollections = [...allStudents].sort((a, b) => b.cardsCollected - a.cardsCollected);
                setTopCollectors(sortedByCollections);

            } catch (error) {
                console.error("Error fetching rankings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRankings();
    }, []);


    const getRankCellStyle = (rank: number) => {
        if (rank === 1) return "text-yellow-500 font-bold";
        if (rank === 2) return "text-gray-500 font-semibold"; 
        if (rank === 3) return "text-orange-600 font-semibold"; 
        return "text-muted-foreground";
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-2">Carregando rankings...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Trophy className="h-7 w-7" /> Rankings IFCoins
            </h1>
            <p className="text-muted-foreground">Veja quem está no topo da competição!</p>

            <Tabs defaultValue="coins" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="coins"><Coins className="mr-2 h-4 w-4" /> Mais IFCoins</TabsTrigger>
                    <TabsTrigger value="collection"><Gem className="mr-2 h-4 w-4" /> Melhores Colecionadores</TabsTrigger>
                </TabsList>
                <TabsContent value="coins">
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Ranking de Moedas</CardTitle>
                            <CardDescription>Alunos com o maior saldo de IFCoins.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ScrollArea className="h-[60vh]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[60px]">Rank</TableHead>
                                            <TableHead>Aluno</TableHead>
                                            <TableHead>Curso</TableHead>
                                            <TableHead className="text-right">Saldo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topCoinHolders.map((user, index) => (
                                            <TableRow key={user.id} className={user.id === currentUserId ? "bg-primary/10" : ""}>
                                                <TableCell className={`font-bold text-lg ${getRankCellStyle(index + 1)}`}>
                                                    {(index + 1) <= 3 ? <Trophy className="h-5 w-5 inline-block -mt-1 mr-1" /> : '#'}{index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                             <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.id}.png?size=40`} alt={user.name} />
                                                            <AvatarFallback>{user.initials}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{user.name}</span>
                                                         {user.id === currentUserId && <Badge variant="outline" className="text-xs bg-accent/80 text-accent-foreground">Você</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{user.course}</TableCell>
                                                <TableCell className="text-right font-semibold text-yellow-600">
                                                    <Coins className="h-4 w-4 inline-block mr-1 -mt-1" />{user.coins.toLocaleString('pt-BR')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {topCoinHolders.length === 0 && (
                                            <TableRow><TableCell colSpan={4} className="text-center py-4">Nenhum aluno no ranking de moedas.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                             </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="collection">
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Ranking de Colecionadores</CardTitle>
                            <CardDescription>Alunos com as coleções mais valiosas (mais cartas únicas).</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ScrollArea className="h-[60vh]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[60px]">Rank</TableHead>
                                            <TableHead>Aluno</TableHead>
                                             <TableHead>Curso</TableHead>
                                            <TableHead className="text-center">Cartas Únicas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topCollectors.map((user, index) => (
                                            <TableRow key={user.id} className={user.id === currentUserId ? "bg-primary/10" : ""}>
                                                <TableCell className={`font-bold text-lg ${getRankCellStyle(index + 1)}`}>
                                                     {(index + 1) <= 3 ? <Trophy className="h-5 w-5 inline-block -mt-1 mr-1" /> : '#'}{index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                             <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.id}.png?size=40`} alt={user.name} />
                                                            <AvatarFallback>{user.initials}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{user.name}</span>
                                                         {user.id === currentUserId && <Badge variant="outline" className="text-xs bg-accent/80 text-accent-foreground">Você</Badge>}
                                                    </div>
                                                </TableCell>
                                                 <TableCell className="text-sm text-muted-foreground">{user.course}</TableCell>
                                                <TableCell className="text-center font-semibold text-blue-600">{user.cardsCollected}</TableCell>
                                            </TableRow>
                                        ))}
                                        {topCollectors.length === 0 && (
                                            <TableRow><TableCell colSpan={4} className="text-center py-4">Nenhum aluno no ranking de colecionadores.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
