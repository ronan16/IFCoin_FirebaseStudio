
// src/app/dashboard/shop/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, ShoppingCart, Package, Star, Loader2 } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase/firebase'; // Import auth and db
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, onSnapshot, runTransaction, Timestamp, collection, query, where, setDoc, updateDoc } from "firebase/firestore";

// Interfaces matching AdminDashboard definitions
interface CardData {
    id: string;
    name: string;
    rarity: "Comum" | "Raro" | "Lendário" | "Mítico";
    imageUrl: string;
    available: boolean;
    copiesAvailable?: number | null;
    eventId?: string | null;
    price?: number;
}

interface EventData {
    id: string;
    name: string;
    startDate: Date | Timestamp;
    endDate: Date | Timestamp;
    imageUrl: string;
    description: string;
    bonusMultiplier: number;
    status?: 'Ativo' | 'Agendado' | 'Concluído'; // Calculated
    linkedCards?: string[];
}

// Mock Data for Packs (remains mock for now)
const availablePacks = [
    { id: "pack001", name: "Pacote Iniciante", description: "Contém 3 cartas comuns.", price: 10, imageUrl: "https://placehold.co/200x200.png", dataAiHint: "game pack" },
    { id: "pack002", name: "Pacote Surpresa Mensal", description: "Chance de raras e lendárias! Limite 1/mês.", price: 50, imageUrl: "https://placehold.co/200x200.png", dataAiHint: "mystery box", limitReached: false },
];

const getRarityClass = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'mítico': return 'bg-purple-200 text-purple-800 border-purple-300';
    case 'lendário': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
    case 'raro': return 'bg-blue-200 text-blue-800 border-blue-300';
    case 'comum':
    default: return 'bg-gray-200 text-gray-800 border-gray-300';
  }
};

const getEventStatus = (event: EventData): 'Ativo' | 'Agendado' | 'Concluído' => {
    const now = new Date();
    const startDate = event.startDate instanceof Timestamp ? event.startDate.toDate() : new Date(event.startDate);
    const endDate = event.endDate instanceof Timestamp ? event.endDate.toDate() : new Date(event.endDate);

    if (endDate < now) return 'Concluído';
    if (startDate > now) return 'Agendado';
    return 'Ativo';
};

export default function ShopPage() {
    const { toast } = useToast();
    const [itemToBuy, setItemToBuy] = useState<CardData | null>(null);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userCoins, setUserCoins] = useState<number>(0);
    const [allCards, setAllCards] = useState<CardData[]>([]);
    const [allEvents, setAllEvents] = useState<EventData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                const userDocRef = doc(db, "users", user.uid);
                const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserCoins(docSnap.data()?.coins || 0);
                    }
                });
                return () => unsubscribeUser();
            } else {
                setCurrentUser(null);
                setUserCoins(0);
            }
        });

        const unsubscribeCards = onSnapshot(collection(db, "cards"), (snapshot) => {
            const cardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardData));
            setAllCards(cardsData);
            if (isLoading) setIsLoading(false); 
        }, (error) => {
            console.error("Error fetching cards:", error);
            toast({ title: "Erro ao buscar cartas", description: error.message, variant: "destructive" });
            if (isLoading) setIsLoading(false);
        });

        const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
            const eventsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    startDate: data.startDate, 
                    endDate: data.endDate,
                } as EventData;
            });
            setAllEvents(eventsData);
        }, (error) => {
            console.error("Error fetching events:", error);
            toast({ title: "Erro ao buscar eventos", description: error.message, variant: "destructive" });
        });

        return () => {
            unsubscribeAuth();
            unsubscribeCards();
            unsubscribeEvents();
        };
    }, [toast, isLoading]);

    const cardsForSale = allCards.filter(card => {
        const isStockAvailable = card.copiesAvailable === null || (card.copiesAvailable !== undefined && card.copiesAvailable > 0);
        if (!isStockAvailable) return false;

        if (card.eventId) {
            const linkedEvent = allEvents.find(e => e.id === card.eventId);
            if (linkedEvent && getEventStatus(linkedEvent) === 'Ativo') {
                return card.available; 
            }
            return false; 
        }
        return card.available; 
    });

    const handleBuyClick = (item: CardData) => {
        if (userCoins < (item.price || 0)) {
            toast({
                title: "IFCoins Insuficientes",
                description: `Você precisa de ${item.price || 0} IFCoins para comprar ${item.name}, mas possui apenas ${userCoins}.`,
                variant: "destructive",
            });
        } else {
            setItemToBuy(item);
        }
    };

    const confirmPurchase = async () => {
        if (!itemToBuy || !currentUser || isPurchasing) return;
        setIsPurchasing(true);

        const cardToBuy = itemToBuy;

        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, "users", currentUser.uid);
                const cardDocRef = doc(db, "cards", cardToBuy.id);
                const userOwnedCardDocRef = doc(db, "users", currentUser.uid, "ownedCards", cardToBuy.id);

                const userDoc = await transaction.get(userDocRef);
                const cardDoc = await transaction.get(cardDocRef);
                const userOwnedCardDoc = await transaction.get(userOwnedCardDocRef);

                if (!userDoc.exists()) {
                    throw new Error("Usuário não encontrado.");
                }
                if (!cardDoc.exists()) {
                    throw new Error("Carta não encontrada.");
                }

                const currentCoins = userDoc.data().coins || 0;
                const cardPrice = cardToBuy.price || 0;

                if (currentCoins < cardPrice) {
                    throw new Error("IFCoins insuficientes.");
                }

                let currentCopies = cardDoc.data().copiesAvailable;
                if (currentCopies !== null && currentCopies !== undefined) {
                    if (currentCopies <= 0) {
                        throw new Error("Esta carta está esgotada.");
                    }
                    transaction.update(cardDocRef, { copiesAvailable: currentCopies - 1 });
                }
                
                // Update user's coins
                transaction.update(userDocRef, {
                    coins: currentCoins - cardPrice,
                });

                // Add/Update card in user's ownedCards subcollection
                if (userOwnedCardDoc.exists()) {
                    transaction.update(userOwnedCardDocRef, {
                        quantity: (userOwnedCardDoc.data().quantity || 0) + 1
                    });
                } else {
                    transaction.set(userOwnedCardDocRef, {
                        cardId: cardToBuy.id,
                        quantity: 1,
                        // You might want to store a reference to the card document or some denormalized data here too
                        // e.g., name: cardToBuy.name, imageUrl: cardToBuy.imageUrl, rarity: cardToBuy.rarity
                        // For simplicity, we'll just store cardId and quantity now.
                    });
                    // Increment unique cards collected count if it's a new card type for the user
                    transaction.update(userDocRef, {
                        cardsCollected: (userDoc.data().cardsCollected || 0) + 1
                    });
                }
            });

            toast({
                title: "Compra Realizada!",
                description: `Você comprou ${cardToBuy.name} por ${cardToBuy.price || 0} IFCoins.`,
                action: <Button variant="link" size="sm" onClick={() => window.location.href = '/dashboard/collection'}>Ver Coleção</Button>,
            });

        } catch (error: any) {
            console.error("Purchase error:", error);
            toast({
                title: "Erro na Compra",
                description: error.message || "Não foi possível completar a compra.",
                variant: "destructive",
            });
        } finally {
            setItemToBuy(null);
            setIsPurchasing(false);
        }
    };


    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-2">Carregando loja...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                        <ShoppingCart className="h-7 w-7" /> Loja IFCoins
                    </h1>
                    <p className="text-muted-foreground">Gaste seus IFCoins em cartas e pacotes!</p>
                </div>
                 <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border shadow-sm">
                   <Coins className="h-6 w-6 text-yellow-500" />
                   <span className="text-lg font-semibold">{userCoins}</span>
                   <span className="text-sm text-muted-foreground">Seu Saldo</span>
                </div>
            </div>

            {/* Packs Section (Remains Mock) */}
            <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Package className="h-6 w-6" /> Pacotes Disponíveis</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availablePacks.map((pack) => (
                        <Card key={pack.id} className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col">
                            <CardHeader className="p-0 relative h-40">
                                <Image src={pack.imageUrl} alt={pack.name} layout="fill" objectFit="cover" data-ai-hint={pack.dataAiHint || "game item"} />
                            </CardHeader>
                            <CardContent className="pt-4 flex-1">
                                <CardTitle className="text-lg mb-1">{pack.name}</CardTitle>
                                <CardDescription className="text-sm">{pack.description}</CardDescription>
                            </CardContent>
                            <Separator />
                            <CardFooter className="flex justify-between items-center pt-4">
                                <div className="flex items-center gap-1 font-semibold text-yellow-600">
                                    <Coins className="h-4 w-4" /> {pack.price}
                                </div>
                                 <Button
                                    size="sm"
                                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                                    disabled={pack.limitReached || userCoins < pack.price || isPurchasing}
                                    onClick={() => toast({ title: "Funcionalidade de Pacotes", description: "Compra de pacotes será implementada em breve.", variant: "default"})}
                                >
                                    {isPurchasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <ShoppingCart className="mr-2 h-4 w-4" /> {pack.limitReached ? 'Limite Atingido' : 'Comprar'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>

            <Separator />

            {/* Cards Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Star className="h-6 w-6" /> Cartas Individuais</h2>
                {cardsForSale.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-8">Nenhuma carta disponível na loja no momento.</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {cardsForSale.map((card) => (
                         <div key={card.id}> {/* Use div as key provider for AlertDialog */}
                             <Card className={cn(
                                "overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group",
                                (!card.available || (card.copiesAvailable !== null && card.copiesAvailable <= 0)) && "opacity-50 cursor-not-allowed"
                             )}
                                onClick={() => (card.available && (card.price || 0) <= userCoins && (card.copiesAvailable === null || (card.copiesAvailable !== undefined && card.copiesAvailable > 0))) && handleBuyClick(card)}
                             >
                                <CardHeader className="p-0 relative aspect-[5/7]">
                                    <Image src={card.imageUrl} alt={card.name} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" data-ai-hint="trading card" />
                                     {card.copiesAvailable !== null && card.copiesAvailable !== undefined && card.copiesAvailable <= 20 && (
                                        <Badge variant="destructive" className="absolute top-2 right-2 text-xs">Limitado: {card.copiesAvailable}</Badge>
                                     )}
                                     {(!card.available || (card.copiesAvailable !== null && card.copiesAvailable !== undefined && card.copiesAvailable <= 0)) && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Badge variant="secondary">Indisponível</Badge>
                                        </div>
                                     )}
                                </CardHeader>
                                <CardContent className="p-2 text-center flex-1">
                                    <p className="text-sm font-semibold truncate group-hover:text-primary">{card.name}</p>
                                     <Badge variant="outline" className={`text-xs mt-1 ${getRarityClass(card.rarity)}`}>{card.rarity}</Badge>
                                </CardContent>
                                {(card.available && (card.copiesAvailable === null || (card.copiesAvailable !== undefined && card.copiesAvailable > 0))) && (
                                     <CardFooter className="p-2 flex justify-center bg-muted/50">
                                         <div className="flex items-center gap-1 font-semibold text-yellow-600 text-sm">
                                            <Coins className="h-4 w-4" /> {card.price || 0}
                                         </div>
                                     </CardFooter>
                                )}
                            </Card>
                         </div>
                    ))}
                </div>
            </section>

            {/* AlertDialog for purchase confirmation */}
            {itemToBuy && (
                <AlertDialog open={!!itemToBuy} onOpenChange={(open) => !open && setItemToBuy(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Compra?</AlertDialogTitle>
                             <AlertDialogDescription>
                                <div className="flex items-center gap-4">
                                     <Image src={itemToBuy.imageUrl} alt={itemToBuy.name} width={60} height={84} className="rounded" data-ai-hint="trading card small" />
                                     <span>
                                         Deseja comprar a carta "{itemToBuy.name}" ({itemToBuy.rarity}) por {itemToBuy.price || 0} IFCoins? Seu saldo é {userCoins}.
                                         {itemToBuy.copiesAvailable !== null && itemToBuy.copiesAvailable !== undefined && <p className="text-xs mt-1">Restam {itemToBuy.copiesAvailable} unidades.</p>}
                                     </span>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setItemToBuy(null)} disabled={isPurchasing}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmPurchase} className="bg-accent hover:bg-accent/90" disabled={isPurchasing}>
                                {isPurchasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}
    
