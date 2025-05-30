
// src/app/dashboard/trades/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Repeat, ArrowRightLeft, CheckCircle, XCircle, PlusCircle, Coins, Search, MinusCircle, Hourglass, Loader2 } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { auth, db, serverTimestamp } from '@/lib/firebase/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    runTransaction,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface CardMasterData {
    id: string;
    name: string;
    rarity: "Comum" | "Raro" | "Lendário" | "Mítico";
    imageUrl: string;
}

interface OwnedCardDisplayData extends CardMasterData {
    quantity: number;
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    coins: number;
    // avatarUrl?: string; // If needed later
    // initials?: string; // If needed later
}

type TradeItem = { id: string; name: string; quantity: number; imageUrl: string; rarity: string };
type TradeOffer = { cards: TradeItem[]; coins: number };

interface TradeData {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    offeredItems: TradeOffer;
    requestedItems: TradeOffer;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

const getRarityClass = (rarity: string) => {
  switch (rarity?.toLowerCase()) {
    case 'mítico': return 'bg-purple-200 text-purple-800 border-purple-300';
    case 'lendário': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
    case 'raro': return 'bg-blue-200 text-blue-800 border-blue-300';
    case 'comum':
    default: return 'bg-gray-200 text-gray-800 border-gray-300';
  }
};


export default function TradesPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProposingTrade, setIsProposingTrade] = useState(false);

    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [userOwnedCards, setUserOwnedCards] = useState<OwnedCardDisplayData[]>([]);
    const [allSystemCards, setAllSystemCards] = useState<CardMasterData[]>([]);
    const [otherStudents, setOtherStudents] = useState<UserProfile[]>([]);
    const [userTrades, setUserTrades] = useState<TradeData[]>([]);

    const [tradePartner, setTradePartner] = useState<string>('');
    const [offeredItems, setOfferedItems] = useState<TradeOffer>({ cards: [], coins: 0 });
    const [requestedItems, setRequestedItems] = useState<TradeOffer>({ cards: [], coins: 0 });
    const [cardSearchOffer, setCardSearchOffer] = useState('');
    const [cardSearchRequest, setCardSearchRequest] = useState('');

    // Fetch current user, their coins, and other students
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setCurrentUser({
                            id: user.uid,
                            name: data.name || "Usuário",
                            email: user.email || "",
                            role: data.role || "student",
                            coins: data.coins || 0,
                        });
                    } else {
                        setCurrentUser(null);
                    }
                });

                const usersQuery = query(collection(db, "users"), where("role", "==", "student"), where("id", "!=", user.uid));
                const unsubscribeStudents = onSnapshot(usersQuery, (snapshot) => {
                    const studentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
                    setOtherStudents(studentsData);
                });
                
                return () => {
                    unsubscribeUser();
                    unsubscribeStudents();
                };
            } else {
                setCurrentUser(null);
                setOtherStudents([]);
                setIsLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Fetch all system cards (for requesting) and user's owned cards (for offering)
    useEffect(() => {
        setIsLoading(true);
        const fetchCardsData = async () => {
            try {
                // Fetch all system cards
                const cardsCollectionRef = collection(db, "cards");
                const allCardsSnapshot = await getDocs(cardsCollectionRef);
                const allCardsData = allCardsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CardMasterData));
                setAllSystemCards(allCardsData);

                // Fetch user's owned cards if user is available
                if (currentUser) {
                    const ownedCardsColRef = collection(db, "users", currentUser.id, "ownedCards");
                    const ownedQuerySnapshot = await getDocs(ownedCardsColRef);
                    const ownedCardsPromises = ownedQuerySnapshot.docs.map(async (docSnap) => {
                        const ownedCardInfo = docSnap.data() as { cardId: string, quantity: number };
                        const cardDetails = allCardsData.find(c => c.id === ownedCardInfo.cardId);
                        if (cardDetails) {
                            return {
                                ...cardDetails,
                                quantity: ownedCardInfo.quantity,
                            };
                        }
                        return null;
                    });
                    const resolvedOwnedCards = (await Promise.all(ownedCardsPromises)).filter(c => c !== null) as OwnedCardDisplayData[];
                    setUserOwnedCards(resolvedOwnedCards);
                } else {
                    setUserOwnedCards([]);
                }
            } catch (error) {
                console.error("Error fetching cards data:", error);
                toast({ title: "Erro ao buscar dados de cartas", description: (error as Error).message, variant: "destructive" });
            } finally {
                 // This part of loading might finish before userTrades, so only set overall isLoading if trades are also considered
            }
        };
        fetchCardsData();
    }, [currentUser, toast]);

    // Fetch user trades
    useEffect(() => {
        if (!currentUser) {
            setUserTrades([]);
            setIsLoading(false); // No user, no trades to load
            return;
        }
        setIsLoading(true); // Set loading true when starting to fetch trades

        const tradesReceivedQuery = query(collection(db, "trades"), where("toUserId", "==", currentUser.id), orderBy("createdAt", "desc"));
        const tradesSentQuery = query(collection(db, "trades"), where("fromUserId", "==", currentUser.id), orderBy("createdAt", "desc"));

        const unsubscribeReceived = onSnapshot(tradesReceivedQuery, (snapshot) => {
            const received = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TradeData));
            setUserTrades(prev => {
                const existingIds = new Set(prev.map(t => t.id));
                const newTrades = received.filter(t => !existingIds.has(t.id));
                const updatedTrades = prev.map(pt => {
                    const updated = received.find(rt => rt.id === pt.id);
                    return updated || pt;
                });
                return [...updatedTrades, ...newTrades].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            });
            checkOverallLoading();
        }, (error) => {
            console.error("Error fetching received trades:", error);
            toast({ title: "Erro ao buscar trocas recebidas", description: error.message, variant: "destructive" });
            checkOverallLoading();
        });

        const unsubscribeSent = onSnapshot(tradesSentQuery, (snapshot) => {
            const sent = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TradeData));
             setUserTrades(prev => {
                const existingIds = new Set(prev.map(t => t.id));
                const newTrades = sent.filter(t => !existingIds.has(t.id) && t.fromUserId === currentUser.id); // Ensure it's truly a sent trade
                const updatedTrades = prev.map(pt => {
                    const updated = sent.find(st => st.id === pt.id);
                    return updated || pt;
                });
                 // Combine, filter duplicates (preferring updated ones), and sort
                const combined = [...updatedTrades, ...newTrades];
                const uniqueMap = new Map<string, TradeData>();
                combined.forEach(trade => uniqueMap.set(trade.id, trade));
                return Array.from(uniqueMap.values()).sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            });
            checkOverallLoading();
        }, (error) => {
            console.error("Error fetching sent trades:", error);
            toast({ title: "Erro ao buscar trocas enviadas", description: error.message, variant: "destructive" });
            checkOverallLoading();
        });
        
        // Helper to determine when all initial data loads are complete
        let receivedLoaded = false;
        let sentLoaded = false;
        const checkOverallLoading = () => {
            // Consider all data sources (user, cards, trades)
            if (currentUser && allSystemCards.length > 0 && (receivedLoaded || sentLoaded)) {
                setIsLoading(false);
            }
            // Simplified: If trades are being fetched, only set isLoading false when they are done.
            // A more robust solution might use counters or Promise.all for initial setup.
            if (unsubscribeReceived && unsubscribeSent) { // Check if listeners are active
                 // Assuming user and cards are loaded before trades are fetched
                 if (currentUser) setIsLoading(false);
            }
        };
        
        // Initial check after setting up listeners
        if(currentUser) setIsLoading(false); else setIsLoading(true);


        return () => {
            unsubscribeReceived();
            unsubscribeSent();
        };
    }, [currentUser, toast, allSystemCards.length]);


    const addCardToOffer = (card: OwnedCardDisplayData) => {
        const existingCard = offeredItems.cards.find(c => c.id === card.id);
        if (existingCard) {
            if (existingCard.quantity < card.quantity) {
                setOfferedItems(prev => ({
                    ...prev,
                    cards: prev.cards.map(c => c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c)
                }));
            } else {
                toast({ title: "Quantidade Máxima Atingida", description: `Você só possui ${card.quantity}x ${card.name}.`, variant: "destructive" });
            }
        } else {
             if (1 <= card.quantity) {
                 setOfferedItems(prev => ({
                    ...prev,
                    cards: [...prev.cards, { id: card.id, name: card.name, quantity: 1, imageUrl: card.imageUrl, rarity: card.rarity }]
                }));
             } else {
                  toast({ title: "Sem Estoque", description: `Você não possui ${card.name}.`, variant: "destructive" });
             }
        }
    };

     const removeCardFromOffer = (cardId: string) => {
        setOfferedItems(prev => {
            const card = prev.cards.find(c => c.id === cardId);
            if (card && card.quantity > 1) {
                return { ...prev, cards: prev.cards.map(c => c.id === cardId ? { ...c, quantity: c.quantity - 1 } : c) };
            } else {
                return { ...prev, cards: prev.cards.filter(c => c.id !== cardId) };
            }
        });
    };

     const addCardToRequest = (card: CardMasterData) => {
        const existingCard = requestedItems.cards.find(c => c.id === card.id);
        if (existingCard) {
             setRequestedItems(prev => ({
                 ...prev,
                 cards: prev.cards.map(c => c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c)
             }));
        } else {
             setRequestedItems(prev => ({
                 ...prev,
                 cards: [...prev.cards, { id: card.id, name: card.name, quantity: 1, imageUrl: card.imageUrl, rarity: card.rarity }]
             }));
        }
    };

     const removeCardFromRequest = (cardId: string) => {
        setRequestedItems(prev => {
            const card = prev.cards.find(c => c.id === cardId);
            if (card && card.quantity > 1) {
                return { ...prev, cards: prev.cards.map(c => c.id === cardId ? { ...c, quantity: c.quantity - 1 } : c) };
            } else {
                return { ...prev, cards: prev.cards.filter(c => c.id !== cardId) };
            }
        });
    };

     const handleProposeTrade = async () => {
        if (!currentUser) {
            toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
            return;
        }
        if (!tradePartner) {
            toast({ title: "Erro", description: "Selecione um parceiro de troca.", variant: "destructive" });
            return;
        }
         if (offeredItems.cards.length === 0 && offeredItems.coins === 0) {
             toast({ title: "Erro", description: "Você precisa oferecer algo.", variant: "destructive" });
            return;
         }
         if (requestedItems.cards.length === 0 && requestedItems.coins === 0) {
              toast({ title: "Erro", description: "Você precisa pedir algo.", variant: "destructive" });
            return;
         }
        if (offeredItems.coins > currentUser.coins) {
             toast({ title: "Saldo Insuficiente", description: `Você não pode oferecer ${offeredItems.coins} IFCoins. Seu saldo é ${currentUser.coins}.`, variant: "destructive" });
             return;
        }

        setIsSubmitting(true);
        const partnerProfile = otherStudents.find(s => s.id === tradePartner);
        if (!partnerProfile) {
             toast({ title: "Erro", description: "Parceiro de troca não encontrado.", variant: "destructive" });
             setIsSubmitting(false);
             return;
        }

        try {
            await addDoc(collection(db, "trades"), {
                fromUserId: currentUser.id,
                fromUserName: currentUser.name,
                toUserId: partnerProfile.id,
                toUserName: partnerProfile.name,
                offeredItems: offeredItems,
                requestedItems: requestedItems,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast({ title: "Proposta Enviada!", description: "Sua proposta de troca foi enviada com sucesso." });
            setIsProposingTrade(false);
            setTradePartner('');
            setOfferedItems({ cards: [], coins: 0 });
            setRequestedItems({ cards: [], coins: 0 });
            setCardSearchOffer('');
            setCardSearchRequest('');
        } catch (error) {
            console.error("Error proposing trade:", error);
            toast({ title: "Erro ao Enviar Proposta", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTradeAction = async (tradeId: string, action: 'accept' | 'reject' | 'cancel') => {
        if (!currentUser) return;
        setIsSubmitting(true);

        const tradeRef = doc(db, "trades", tradeId);
        const tradeDoc = await getDoc(tradeRef);
        if (!tradeDoc.exists()) {
            toast({ title: "Erro", description: "Troca não encontrada.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
        const tradeData = tradeDoc.data() as TradeData;

        try {
            if (action === 'accept') {
                if (tradeData.toUserId !== currentUser.id) {
                     toast({ title: "Ação não permitida", variant: "destructive" });
                     setIsSubmitting(false);
                     return;
                }
                // Complex transaction to exchange items and coins
                await runTransaction(db, async (transaction) => {
                    const fromUserRef = doc(db, "users", tradeData.fromUserId);
                    const toUserRef = doc(db, "users", tradeData.toUserId); // Current user

                    const fromUserDoc = await transaction.get(fromUserRef);
                    const toUserDoc = await transaction.get(toUserRef);

                    if (!fromUserDoc.exists() || !toUserDoc.exists()) {
                        throw new Error("Um dos usuários da troca não foi encontrado.");
                    }

                    const fromUserData = fromUserDoc.data() as UserProfile;
                    const toUserData = toUserDoc.data() as UserProfile;

                    // 1. Validate coins
                    if (fromUserData.coins < tradeData.offeredItems.coins) throw new Error(`${tradeData.fromUserName} não tem moedas suficientes para oferecer.`);
                    if (toUserData.coins < tradeData.requestedItems.coins) throw new Error(`Você não tem moedas suficientes para oferecer em troca.`);

                    // 2. Validate offered cards by fromUser
                    for (const offeredCard of tradeData.offeredItems.cards) {
                        const fromUserOwnedCardRef = doc(db, "users", fromUserData.id, "ownedCards", offeredCard.id);
                        const fromUserOwnedCardDoc = await transaction.get(fromUserOwnedCardRef);
                        if (!fromUserOwnedCardDoc.exists() || (fromUserOwnedCardDoc.data()?.quantity || 0) < offeredCard.quantity) {
                            throw new Error(`${fromUserData.name} não possui mais a carta ${offeredCard.name} (x${offeredCard.quantity}) para oferecer.`);
                        }
                    }

                    // 3. Validate requested cards by toUser (current user)
                    for (const requestedCard of tradeData.requestedItems.cards) {
                         const toUserOwnedCardRef = doc(db, "users", toUserData.id, "ownedCards", requestedCard.id);
                         const toUserOwnedCardDoc = await transaction.get(toUserOwnedCardRef);
                         if (!toUserOwnedCardDoc.exists() || (toUserOwnedCardDoc.data()?.quantity || 0) < requestedCard.quantity) {
                            throw new Error(`Você não possui mais a carta ${requestedCard.name} (x${requestedCard.quantity}) para oferecer em troca.`);
                        }
                    }
                    
                    // All checks passed, perform updates:

                    // Update Coins
                    transaction.update(fromUserRef, { coins: fromUserData.coins - tradeData.offeredItems.coins + tradeData.requestedItems.coins });
                    transaction.update(toUserRef, { coins: toUserData.coins - tradeData.requestedItems.coins + tradeData.offeredItems.coins });

                    // Update Cards for fromUser (offered cards removed, requested cards added)
                    let fromUserCardsCollectedDelta = 0;
                    for (const card of tradeData.offeredItems.cards) { // Cards GIVEN by fromUser
                        const ownedCardRef = doc(db, "users", fromUserData.id, "ownedCards", card.id);
                        const currentOwned = await transaction.get(ownedCardRef);
                        const newQuantity = (currentOwned.data()?.quantity || 0) - card.quantity;
                        if (newQuantity > 0) transaction.update(ownedCardRef, { quantity: newQuantity });
                        else {
                             transaction.delete(ownedCardRef);
                             // fromUserCardsCollectedDelta--; // Only if this was their last copy of this unique card - simpler to recalculate later or batch updates
                        }
                    }
                    for (const card of tradeData.requestedItems.cards) { // Cards RECEIVED by fromUser
                        const ownedCardRef = doc(db, "users", fromUserData.id, "ownedCards", card.id);
                        const currentOwned = await transaction.get(ownedCardRef);
                        if (!currentOwned.exists()) {
                           // fromUserCardsCollectedDelta++;
                        }
                        transaction.set(ownedCardRef, { cardId: card.id, quantity: (currentOwned.data()?.quantity || 0) + card.quantity }, { merge: true });
                    }

                     // Update Cards for toUser (requested cards removed, offered cards added)
                    let toUserCardsCollectedDelta = 0;
                    for (const card of tradeData.requestedItems.cards) { // Cards GIVEN by toUser
                        const ownedCardRef = doc(db, "users", toUserData.id, "ownedCards", card.id);
                        const currentOwned = await transaction.get(ownedCardRef);
                        const newQuantity = (currentOwned.data()?.quantity || 0) - card.quantity;
                        if (newQuantity > 0) transaction.update(ownedCardRef, { quantity: newQuantity });
                        else {
                            transaction.delete(ownedCardRef);
                            // toUserCardsCollectedDelta--;
                        }
                    }
                    for (const card of tradeData.offeredItems.cards) { // Cards RECEIVED by toUser
                        const ownedCardRef = doc(db, "users", toUserData.id, "ownedCards", card.id);
                        const currentOwned = await transaction.get(ownedCardRef);
                         if (!currentOwned.exists()) {
                           // toUserCardsCollectedDelta++;
                        }
                        transaction.set(ownedCardRef, { cardId: card.id, quantity: (currentOwned.data()?.quantity || 0) + card.quantity }, { merge: true });
                    }

                    // Update cardsCollected (simpler to do this outside transaction or as a separate step if complex)
                    // For now, let's assume `cardsCollected` is updated based on the ownedCards subcollection count elsewhere if needed.
                    // Or, more simply for now, if a new card type is added (doc didn't exist), increment. If a card type is removed (doc deleted), decrement.
                    // This delta logic is complex to get right in a transaction with all edge cases.
                    // A simpler, slightly less accurate approach for now might be to just ensure the trade is completed.
                    // A background function or a re-fetch and count on client side for cardsCollected would be more robust.
                    
                    // For now, we'll skip direct cardsCollected update in transaction to simplify. Re-fetch on client if needed.


                    // Finally, update trade status
                    transaction.update(tradeRef, { status: 'accepted', updatedAt: serverTimestamp() });
                });
                toast({ title: "Troca Aceita!", description: "Os itens e moedas foram trocados." });

            } else if (action === 'reject') {
                 if (tradeData.toUserId !== currentUser.id) {
                     toast({ title: "Ação não permitida", variant: "destructive" });
                     setIsSubmitting(false);
                     return;
                 }
                await updateDoc(tradeRef, { status: 'rejected', updatedAt: serverTimestamp() });
                toast({ title: "Troca Rejeitada." });
            } else if (action === 'cancel') {
                 if (tradeData.fromUserId !== currentUser.id) {
                     toast({ title: "Ação não permitida", variant: "destructive" });
                     setIsSubmitting(false);
                     return;
                 }
                await updateDoc(tradeRef, { status: 'cancelled', updatedAt: serverTimestamp() });
                toast({ title: "Troca Cancelada." });
            }
        } catch (error) {
            console.error(`Error ${action}ing trade:`, error);
            toast({ title: `Erro ao ${action === 'accept' ? 'Aceitar' : action === 'reject' ? 'Rejeitar' : 'Cancelar'} Troca`, description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };


    const getTradeStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Hourglass className="mr-1 h-3 w-3" />Pendente</Badge>;
            case 'accepted': return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Aceita</Badge>;
            case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejeitada</Badge>;
            case 'cancelled': return <Badge variant="outline" className="bg-gray-100 text-gray-600"><XCircle className="mr-1 h-3 w-3" />Cancelada</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const renderTradeItems = (items: TradeOffer, type: 'offered' | 'requested') => (
        <div className="flex flex-wrap gap-1 items-center">
            {items.cards.map(card => (
                <TooltipProvider key={card.id + card.name + type}>
                   <Tooltip>
                       <TooltipTrigger>
                           <div className="relative">
                             <Image src={card.imageUrl || "https://placehold.co/60x84.png"} alt={card.name} width={24} height={34} className="rounded-sm border" data-ai-hint="trading card small" />
                             {card.quantity > 1 && <Badge className={cn("absolute -top-1 -right-1 h-4 w-4 p-0 justify-center text-xs rounded-full", getRarityClass(card.rarity) )}>{card.quantity}</Badge>}
                           </div>
                       </TooltipTrigger>
                       <TooltipContent>{card.name} (x{card.quantity})</TooltipContent>
                   </Tooltip>
                </TooltipProvider>
            ))}
            {items.coins > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 border-yellow-200 text-yellow-700">
                    <Coins className="h-3 w-3" /> {items.coins}
                </Badge>
            )}
             {(items.cards.length === 0 && items.coins === 0) && <span className="text-xs text-muted-foreground">-</span>}
        </div>
    );

    const filteredOwnedCards = userOwnedCards.filter(card => card.name.toLowerCase().includes(cardSearchOffer.toLowerCase()));
    const filteredAllCards = allSystemCards.filter(card => card.name.toLowerCase().includes(cardSearchRequest.toLowerCase()));

    if (isLoading && !currentUser) { // Show loader if essential data (currentUser) is not yet available
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-2">Carregando dados de trocas...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                    <Repeat className="h-7 w-7" /> Trocas de Cartas
                </h1>
                 <Dialog open={isProposingTrade} onOpenChange={setIsProposingTrade}>
                    <DialogTrigger asChild>
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!currentUser || otherStudents.length === 0}>
                           <PlusCircle className="mr-2 h-4 w-4" /> Propor Nova Troca
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Propor Nova Troca</DialogTitle>
                            <DialogDescription>Selecione o parceiro e os itens que deseja oferecer e receber.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-green-600">Sua Oferta</h3>
                                <Separator />
                                <Label>Cartas Oferecidas</Label>
                                <ScrollArea className="h-24 border rounded-md p-2 bg-green-50/50">
                                     {offeredItems.cards.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhuma carta selecionada.</p>}
                                     <div className="flex flex-wrap gap-2">
                                        {offeredItems.cards.map(card => (
                                            <div key={"offer-"+card.id} className="relative p-1 border rounded bg-white shadow-sm">
                                                <Image src={card.imageUrl || "https://placehold.co/60x84.png"} alt={card.name} width={40} height={56} className="rounded-sm" data-ai-hint="trading card small" />
                                                 <Badge className={cn("absolute -top-1 -right-1 h-4 w-4 p-0 justify-center text-xs rounded-full", getRarityClass(card.rarity))}>{card.quantity}</Badge>
                                                <Button variant="ghost" size="icon" className="absolute -bottom-1 -right-1 h-5 w-5 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => removeCardFromOffer(card.id)}>
                                                    <MinusCircle className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ))}
                                     </div>
                                </ScrollArea>
                                 <div className="space-y-1">
                                      <Label htmlFor="search-offer">Adicionar Cartas da Sua Coleção</Label>
                                      <Input id="search-offer" placeholder="Buscar em sua coleção..." value={cardSearchOffer} onChange={e => setCardSearchOffer(e.target.value)} />
                                 </div>
                                <ScrollArea className="h-40 border rounded-md p-2">
                                    {userOwnedCards.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Você não possui cartas para oferecer.</p>}
                                    <div className="grid grid-cols-3 gap-2">
                                        {filteredOwnedCards.map(card => (
                                             <button key={"owned-"+card.id} className="relative p-1 border rounded hover:border-primary transition-colors text-center group disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => addCardToOffer(card)}
                                                disabled={(offeredItems.cards.find(c => c.id === card.id)?.quantity ?? 0) >= card.quantity}
                                             >
                                                <Image src={card.imageUrl || "https://placehold.co/60x84.png"} alt={card.name} width={50} height={70} className="mx-auto rounded-sm mb-1" data-ai-hint="trading card game" />
                                                <p className="text-[10px] leading-tight font-medium truncate group-hover:text-primary">{card.name}</p>
                                                 <p className="text-[9px] text-muted-foreground">x{card.quantity}</p>
                                                {(offeredItems.cards.find(c => c.id === card.id)?.quantity ?? 0) >= card.quantity && <div className="absolute inset-0 bg-black/30 rounded"></div>}
                                            </button>
                                        ))}
                                        {filteredOwnedCards.length === 0 && userOwnedCards.length > 0 && <p className="text-xs text-muted-foreground col-span-3 text-center py-4">Nenhuma carta encontrada na busca.</p>}
                                    </div>
                                </ScrollArea>
                                <div className="space-y-1">
                                    <Label htmlFor="offer-coins">Oferecer IFCoins</Label>
                                    <div className="flex items-center gap-2">
                                         <Coins className="h-4 w-4 text-yellow-500"/>
                                         <Input id="offer-coins" type="number" min="0" value={offeredItems.coins} onChange={e => setOfferedItems(prev => ({...prev, coins: Math.max(0, parseInt(e.target.value) || 0)}))} className="w-24" />
                                         <span className="text-xs text-muted-foreground">Seu saldo: {currentUser?.coins || 0}</span>
                                    </div>
                                     {currentUser && offeredItems.coins > currentUser.coins && <p className="text-xs text-destructive">Saldo insuficiente.</p>}
                                </div>
                            </div>
                             <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-blue-600">Seu Pedido</h3>
                                <Separator />
                                <Label>Cartas Pedidas</Label>
                                <ScrollArea className="h-24 border rounded-md p-2 bg-blue-50/50">
                                     {requestedItems.cards.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhuma carta selecionada.</p>}
                                    <div className="flex flex-wrap gap-2">
                                        {requestedItems.cards.map(card => (
                                            <div key={"request-"+card.id} className="relative p-1 border rounded bg-white shadow-sm">
                                                <Image src={card.imageUrl || "https://placehold.co/60x84.png"} alt={card.name} width={40} height={56} className="rounded-sm" data-ai-hint="trading card small" />
                                                <Badge className={cn("absolute -top-1 -right-1 h-4 w-4 p-0 justify-center text-xs rounded-full", getRarityClass(card.rarity))}>{card.quantity}</Badge>
                                                <Button variant="ghost" size="icon" className="absolute -bottom-1 -right-1 h-5 w-5 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => removeCardFromRequest(card.id)}>
                                                    <MinusCircle className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                 <div className="space-y-1">
                                    <Label htmlFor="search-request">Adicionar Cartas para Pedir</Label>
                                    <Input id="search-request" placeholder="Buscar todas as cartas..." value={cardSearchRequest} onChange={e => setCardSearchRequest(e.target.value)} />
                                 </div>
                                <ScrollArea className="h-40 border rounded-md p-2">
                                     {allSystemCards.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma carta no sistema.</p>}
                                     <div className="grid grid-cols-3 gap-2">
                                        {filteredAllCards.map(card => (
                                            <button key={"all-"+card.id} className="relative p-1 border rounded hover:border-primary transition-colors text-center group" onClick={() => addCardToRequest(card)}>
                                                <Image src={card.imageUrl || "https://placehold.co/60x84.png"} alt={card.name} width={50} height={70} className="mx-auto rounded-sm mb-1" data-ai-hint="trading card game" />
                                                <p className="text-[10px] leading-tight font-medium truncate group-hover:text-primary">{card.name}</p>
                                            </button>
                                        ))}
                                         {filteredAllCards.length === 0 && allSystemCards.length > 0 && <p className="text-xs text-muted-foreground col-span-3 text-center py-4">Nenhuma carta encontrada na busca.</p>}
                                    </div>
                                </ScrollArea>
                                <div className="space-y-1">
                                    <Label htmlFor="request-coins">Pedir IFCoins</Label>
                                     <div className="flex items-center gap-2">
                                         <Coins className="h-4 w-4 text-yellow-500"/>
                                         <Input id="request-coins" type="number" min="0" value={requestedItems.coins} onChange={e => setRequestedItems(prev => ({...prev, coins: Math.max(0, parseInt(e.target.value) || 0)}))} className="w-24" />
                                     </div>
                                </div>
                            </div>
                        </div>
                         <Separator />
                        <div className="pt-4 space-y-2">
                            <Label htmlFor="trade-partner">Parceiro de Troca</Label>
                             <Select value={tradePartner} onValueChange={setTradePartner} disabled={otherStudents.length === 0}>
                                <SelectTrigger id="trade-partner">
                                    <SelectValue placeholder={otherStudents.length === 0 ? "Nenhum outro aluno encontrado" : "Selecione com quem você quer trocar"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {otherStudents.map(student => (
                                        <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                             </DialogClose>
                            <Button onClick={handleProposeTrade} className="bg-accent hover:bg-accent/90" disabled={isSubmitting || !currentUser || !tradePartner || (offeredItems.cards.length === 0 && offeredItems.coins === 0) || (requestedItems.cards.length === 0 && requestedItems.coins === 0) || (currentUser && offeredItems.coins > currentUser.coins) }>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Enviar Proposta
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Minhas Trocas</CardTitle>
                     <CardDescription>Gerencie suas propostas enviadas e recebidas.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ScrollArea className="h-[50vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Parceiro</TableHead>
                                    <TableHead>Oferecido por Mim</TableHead>
                                    <TableHead>Pedido por Mim</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && userTrades.length === 0 && (
                                     <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="inline h-5 w-5 animate-spin mr-2"/> Carregando trocas...</TableCell></TableRow>
                                )}
                                {!isLoading && userTrades.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Você ainda não tem nenhuma troca.</TableCell></TableRow>
                                )}
                                {userTrades.map((trade) => {
                                    const isOutgoing = trade.fromUserId === currentUser?.id;
                                    const partnerName = isOutgoing ? trade.toUserName : trade.fromUserName;
                                    const myOffer = isOutgoing ? trade.offeredItems : trade.requestedItems;
                                    const theirOffer = isOutgoing ? trade.requestedItems : trade.offeredItems;

                                    return (
                                        <TableRow key={trade.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    {isOutgoing ? <ArrowRightLeft size={14} className="text-blue-500"/> : <ArrowRightLeft size={14} className="text-green-500"/>}
                                                    <span className="font-medium">{partnerName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{renderTradeItems(myOffer, isOutgoing ? 'offered' : 'requested')}</TableCell>
                                            <TableCell>{renderTradeItems(theirOffer, isOutgoing ? 'requested' : 'offered')}</TableCell>
                                            <TableCell>{getTradeStatusBadge(trade.status)}</TableCell>
                                            <TableCell className="text-right">
                                                {trade.status === 'pending' && !isOutgoing && currentUser?.id === trade.toUserId && (
                                                    <div className="flex gap-2 justify-end">
                                                         <Button size="sm" variant="ghost" className="h-7 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleTradeAction(trade.id, 'accept')} disabled={isSubmitting}>
                                                             {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4" />}
                                                         </Button>
                                                         <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleTradeAction(trade.id, 'reject')} disabled={isSubmitting}>
                                                             {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4" />}
                                                         </Button>
                                                    </div>
                                                )}
                                                 {trade.status === 'pending' && isOutgoing && (
                                                      <Button size="sm" variant="outline" className="h-7 text-orange-600 hover:bg-orange-100 hover:text-orange-700" onClick={() => handleTradeAction(trade.id, 'cancel')} disabled={isSubmitting}>
                                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4 mr-1" />} Cancelar
                                                      </Button>
                                                 )}
                                                 {trade.status !== 'pending' && (
                                                      <Button size="sm" variant="ghost" className="h-7 text-muted-foreground" disabled>Concluída</Button>
                                                 )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                     </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}


    