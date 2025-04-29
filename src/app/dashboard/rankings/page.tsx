// src/app/dashboard/rankings/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Coins, Gem, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';


// Mock Data - Replace with actual data fetching
const topCoinHolders = [
    { rank: 1, id: "uid4", name: "Ana Amiga Pereira", avatarUrl: "https://picsum.photos/id/1027/40/40", initials: "AP", coins: 580, class: "3A INFO" },
    { rank: 2, id: "uid2", name: "Maria Estudante Souza", avatarUrl: "https://picsum.photos/id/1011/40/40", initials: "MS", coins: 450, class: "2B AGRO" },
    { rank: 3, id: "uid1", name: "João Aluno Silva", avatarUrl: "https://picsum.photos/id/237/40/40", initials: "JS", coins: 150, class: "2A INFO" },
    { rank: 4, id: "uid3", name: "Pedro Colega Oliveira", avatarUrl: "https://picsum.photos/id/1005/40/40", initials: "PO", coins: 120, class: "2A INFO" },
    { rank: 5, id: "uid5", name: "Sofia Curiosa Lima", avatarUrl: "https://picsum.photos/id/1012/40/40", initials: "SL", coins: 95, class: "3B AGRO" },
    { rank: 6, id: "uid6", name: "Lucas Gamer Rocha", avatarUrl: "https://picsum.photos/id/1025/40/40", initials: "LR", coins: 80, class: "1A INFO" },

];

const topCollectors = [
     { rank: 1, id: "uid2", name: "Maria Estudante Souza", avatarUrl: "https://picsum.photos/id/1011/40/40", initials: "MS", uniqueCards: 85, totalCards: 150, class: "2B AGRO" },
     { rank: 2, id: "uid4", name: "Ana Amiga Pereira", avatarUrl: "https://picsum.photos/id/1027/40/40", initials: "AP", uniqueCards: 70, totalCards: 110, class: "3A INFO" },
     { rank: 3, id: "uid3", name: "Pedro Colega Oliveira", avatarUrl: "https://picsum.photos/id/1005/40/40", initials: "PO", uniqueCards: 55, totalCards: 90, class: "2A INFO" },
     { rank: 4, id: "uid1", name: "João Aluno Silva", avatarUrl: "https://picsum.photos/id/237/40/40", initials: "JS", uniqueCards: 25, totalCards: 40, class: "2A INFO" },
     { rank: 5, id: "uid6", name: "Lucas Gamer Rocha", avatarUrl: "https://picsum.photos/id/1025/40/40", initials: "LR", uniqueCards: 20, totalCards: 30, class: "1A INFO" },
     { rank: 6, id: "uid5", name: "Sofia Curiosa Lima", avatarUrl: "https://picsum.photos/id/1012/40/40", initials: "SL", uniqueCards: 15, totalCards: 25, class: "3B AGRO" },

];

// Example current user ID
const currentUserId = "uid1";

export default function RankingsPage() {

    const getRankCellStyle = (rank: number) => {
        if (rank === 1) return "text-yellow-500 font-bold";
        if (rank === 2) return "text-gray-500 font-semibold";
        if (rank === 3) return "text-orange-600 font-semibold";
        return "text-muted-foreground";
    };

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
                             <ScrollArea className="h-[60vh]"> {/* Adjust height */}
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px]">Rank</TableHead>
                                            <TableHead>Aluno</TableHead>
                                            <TableHead>Turma</TableHead>
                                            <TableHead className="text-right">Saldo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topCoinHolders.map((user) => (
                                            <TableRow key={user.id} className={user.id === currentUserId ? "bg-accent/10" : ""}>
                                                <TableCell className={`font-bold text-lg ${getRankCellStyle(user.rank)}`}>
                                                    {user.rank <= 3 ? <Trophy className="h-5 w-5 inline-block -mt-1 mr-1" /> : '#'}{user.rank}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                            <AvatarFallback>{user.initials}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{user.name}</span>
                                                         {user.id === currentUserId && <Badge variant="outline" className="text-xs">Você</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{user.class}</TableCell>
                                                <TableCell className="text-right font-semibold text-yellow-600">
                                                    <Coins className="h-4 w-4 inline-block mr-1 -mt-1" />{user.coins.toLocaleString('pt-BR')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
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
                            <CardDescription>Alunos com as coleções mais completas (cartas únicas).</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ScrollArea className="h-[60vh]"> {/* Adjust height */}
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px]">Rank</TableHead>
                                            <TableHead>Aluno</TableHead>
                                             <TableHead>Turma</TableHead>
                                            <TableHead className="text-center">Cartas Únicas</TableHead>
                                            <TableHead className="text-right">Total de Cartas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topCollectors.map((user) => (
                                            <TableRow key={user.id} className={user.id === currentUserId ? "bg-accent/10" : ""}>
                                                <TableCell className={`font-bold text-lg ${getRankCellStyle(user.rank)}`}>
                                                     {user.rank <= 3 ? <Trophy className="h-5 w-5 inline-block -mt-1 mr-1" /> : '#'}{user.rank}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                            <AvatarFallback>{user.initials}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{user.name}</span>
                                                         {user.id === currentUserId && <Badge variant="outline" className="text-xs">Você</Badge>}
                                                    </div>
                                                </TableCell>
                                                 <TableCell className="text-sm text-muted-foreground">{user.class}</TableCell>
                                                <TableCell className="text-center font-semibold text-blue-600">{user.uniqueCards}</TableCell>
                                                <TableCell className="text-right font-medium text-muted-foreground">{user.totalCards}</TableCell>
                                            </TableRow>
                                        ))}
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
