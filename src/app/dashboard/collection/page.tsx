
// src/app/dashboard/collection/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, Search, Filter, ArrowUpDown, Loader2 } from "lucide-react";
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, query, Unsubscribe } from 'firebase/firestore';

interface OwnedCardData {
    id: string; // This will be the card's actual ID from the 'cards' collection
    name: string;
    rarity: "Comum" | "Raro" | "Lendário" | "Mítico";
    imageUrl: string;
    quantity: number;
}

interface CardMasterData { // For fetching all card details once
    id: string;
    name: string;
    rarity: "Comum" | "Raro" | "Lendário" | "Mítico";
    imageUrl: string;
    // other fields if needed by collection page that aren't in OwnedCardData
}


// Helper function to get rarity color
const getRarityClass = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'mítico': return 'bg-purple-200 text-purple-800 border-purple-300';
    case 'lendário': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
    case 'raro': return 'bg-blue-200 text-blue-800 border-blue-300';
    case 'comum':
    default: return 'bg-gray-200 text-gray-800 border-gray-300';
  }
};

const rarityOrder = { 'comum': 1, 'raro': 2, 'lendário': 3, 'mítico': 4 };

export default function CollectionPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRarity, setFilterRarity] = useState('all');
    const [sortBy, setSortBy] = useState('name-asc');
    
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [ownedCardsData, setOwnedCardsData] = useState<OwnedCardData[]>([]);
    const [allCardsMap, setAllCardsMap] = useState<Map<string, CardMasterData>>(new Map());
    const [totalSystemCards, setTotalSystemCards] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) {
                setIsLoading(false); // No user, stop loading
                setOwnedCardsData([]); // Clear data if user logs out
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        // Fetch all card definitions once to build a map for easy lookup
        // and to get the total number of unique cards in the system.
        const fetchAllCards = async () => {
            try {
                const cardsCollectionRef = collection(db, "cards");
                const querySnapshot = await getDocs(cardsCollectionRef);
                const cardsMap = new Map<string, CardMasterData>();
                querySnapshot.forEach((doc) => {
                    cardsMap.set(doc.id, { id: doc.id, ...doc.data() } as CardMasterData);
                });
                setAllCardsMap(cardsMap);
                setTotalSystemCards(cardsMap.size);
            } catch (error) {
                console.error("Error fetching all card definitions:", error);
                // Handle error, maybe set a toast
            }
        };
        fetchAllCards();
    }, []);
    
    useEffect(() => {
        if (!currentUser || allCardsMap.size === 0) {
             if (!currentUser) setIsLoading(false); // If no user and map isn't ready, might still be loading map
             if (currentUser && allCardsMap.size === 0 && totalSystemCards > 0) {
                // map is loading, wait
             } else {
                setIsLoading(false); // Map is empty or user is null
             }
            return;
        }

        setIsLoading(true);
        const ownedCardsColRef = collection(db, "users", currentUser.uid, "ownedCards");
        const unsubscribeOwnedCards = onSnapshot(query(ownedCardsColRef), (snapshot) => {
            const newOwnedCards: OwnedCardData[] = [];
            snapshot.forEach((docSnap) => {
                const ownedCardInfo = docSnap.data() as { cardId: string, quantity: number };
                const cardDetails = allCardsMap.get(ownedCardInfo.cardId);
                if (cardDetails) {
                    newOwnedCards.push({
                        id: cardDetails.id,
                        name: cardDetails.name,
                        rarity: cardDetails.rarity,
                        imageUrl: cardDetails.imageUrl,
                        quantity: ownedCardInfo.quantity,
                    });
                }
            });
            setOwnedCardsData(newOwnedCards);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching owned cards:", error);
            setIsLoading(false);
            // Handle error
        });

        return () => unsubscribeOwnedCards();
    }, [currentUser, allCardsMap, totalSystemCards]);


    const filteredAndSortedCards = ownedCardsData
        .filter(card =>
            card.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (filterRarity === 'all' || card.rarity.toLowerCase() === filterRarity.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'rarity-asc': return rarityOrder[a.rarity.toLowerCase() as keyof typeof rarityOrder] - rarityOrder[b.rarity.toLowerCase() as keyof typeof rarityOrder];
                case 'rarity-desc': return rarityOrder[b.rarity.toLowerCase() as keyof typeof rarityOrder] - rarityOrder[a.rarity.toLowerCase() as keyof typeof rarityOrder];
                case 'quantity-asc': return a.quantity - b.quantity;
                case 'quantity-desc': return b.quantity - a.quantity;
                default: return 0;
            }
        });

    const uniqueCardCount = ownedCardsData.length; // Each entry in ownedCardsData is a unique card type
    const collectionProgress = totalSystemCards > 0 ? Math.round((uniqueCardCount / totalSystemCards) * 100) : 0;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-2">Carregando coleção...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                        <LayoutGrid className="h-7 w-7" /> Minha Coleção
                    </h1>
                    <p className="text-muted-foreground">
                         Você possui {uniqueCardCount} cartas únicas de {totalSystemCards} ({collectionProgress}% completo).
                    </p>
                </div>
                 <Button variant="outline" onClick={() => window.location.href='/dashboard/trades'}> 
                     <Filter className="mr-2 h-4 w-4" /> Ir para Trocas
                 </Button>
            </div>

            {/* Filters and Sorting */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                     <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                         <Select value={filterRarity} onValueChange={setFilterRarity}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filtrar por Raridade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Raridades</SelectItem>
                                <SelectItem value="Comum">Comum</SelectItem>
                                <SelectItem value="Raro">Raro</SelectItem>
                                <SelectItem value="Lendário">Lendário</SelectItem>
                                <SelectItem value="Mítico">Mítico</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select value={sortBy} onValueChange={setSortBy}>
                             <SelectTrigger className="w-full md:w-[180px]">
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Ordenar por" />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                                <SelectItem value="rarity-asc">Raridade (Menor)</SelectItem>
                                <SelectItem value="rarity-desc">Raridade (Maior)</SelectItem>
                                <SelectItem value="quantity-asc">Quantidade (Menor)</SelectItem>
                                <SelectItem value="quantity-desc">Quantidade (Maior)</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>
                </CardContent>
            </Card>

            {/* Card Grid */}
            {filteredAndSortedCards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredAndSortedCards.map((card) => (
                        <Card key={card.id} className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow group relative cursor-pointer">
                             <CardHeader className="p-0 relative aspect-[5/7]">
                                <Image src={card.imageUrl} alt={card.name} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" data-ai-hint="trading card game" />
                                {card.quantity > 0 && ( // Show quantity if > 0, could be just 1 as well
                                    <Badge variant="secondary" className="absolute top-2 left-2 h-6 w-6 p-0 flex items-center justify-center rounded-full bg-primary/80 text-primary-foreground font-bold text-xs shadow">
                                        x{card.quantity}
                                    </Badge>
                                )}
                             </CardHeader>
                            <CardContent className="p-2 text-center">
                                <p className="text-sm font-semibold truncate group-hover:text-primary">{card.name}</p>
                                <Badge variant="outline" className={`text-xs mt-1 ${getRarityClass(card.rarity)}`}>{card.rarity}</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhuma carta encontrada em sua coleção{searchTerm || filterRarity !== 'all' ? ' com os filtros selecionados' : ''}.</p>
                    <Button variant="link" onClick={() => { setSearchTerm(''); setFilterRarity('all'); setSortBy('name-asc'); }}>Limpar filtros</Button>
                 </div>
            )}
        </div>
    );
}

