// src/app/dashboard/events/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Star, Gift, Eye, Loader2 } from "lucide-react";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase/firebase';
import { collection, onSnapshot, Timestamp, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface CardMasterData {
    id: string;
    name: string;
    rarity: "Comum" | "Raro" | "Lendário" | "Mítico";
    imageUrl: string;
}

interface EventData {
    id: string;
    name: string;
    description: string;
    startDate: Timestamp | Date;
    endDate: Timestamp | Date;
    bonusMultiplier: number;
    status?: 'Ativo' | 'Agendado' | 'Concluído'; // Calculated client-side
    imageUrl: string;
    linkedCards?: string[]; // Array of card IDs
}

interface DisplayEvent extends EventData {
    displayLinkedCards: CardMasterData[];
}


const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
     switch (status.toLowerCase()) {
        case 'ativo': return 'default';
        case 'agendado': return 'secondary';
        case 'concluído': return 'outline';
        default: return 'outline';
     }
 }

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


export default function EventsPage() {
    const { toast } = useToast();
    const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
    const [allEvents, setAllEvents] = useState<EventData[]>([]);
    const [allCardsMap, setAllCardsMap] = useState<Map<string, CardMasterData>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch all card definitions once to build a map for easy lookup
        const fetchAllCards = async () => {
            try {
                const cardsCollectionRef = collection(db, "cards");
                const querySnapshot = await getDocs(cardsCollectionRef);
                const cardsMap = new Map<string, CardMasterData>();
                querySnapshot.forEach((doc) => {
                    cardsMap.set(doc.id, { id: doc.id, ...doc.data() } as CardMasterData);
                });
                setAllCardsMap(cardsMap);
            } catch (error: any) {
                console.error("Error fetching all card definitions:", error);
                toast({ title: "Erro ao buscar cartas", description: error.message, variant: "destructive" });
            }
        };
        fetchAllCards();
    }, [toast]);

    useEffect(() => {
        setIsLoading(true);
        const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
            const eventsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    startDate: data.startDate, // Firestore Timestamps are fine for now
                    endDate: data.endDate,
                } as EventData;
            });
            setAllEvents(eventsData.map(e => ({ ...e, status: getEventStatus(e) }))); // Calculate status here
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching events:", error);
            toast({ title: "Erro ao buscar eventos", description: error.message, variant: "destructive" });
            setIsLoading(false);
        });

        return () => unsubscribeEvents();
    }, [toast]);

    const displayEvents: DisplayEvent[] = allEvents
        .map(event => {
            const linkedCardDetails: CardMasterData[] = [];
            if (event.linkedCards && allCardsMap.size > 0) {
                event.linkedCards.forEach(cardId => {
                    const cardDetail = allCardsMap.get(cardId);
                    if (cardDetail) {
                        linkedCardDetails.push(cardDetail);
                    }
                });
            }
            return { ...event, displayLinkedCards: linkedCardDetails };
        });


    const filteredEvents = displayEvents.filter(event => {
        if (filter === 'all') return true;
        if (filter === 'active' && event.status === 'Ativo') return true;
        if (filter === 'upcoming' && event.status === 'Agendado') return true;
        if (filter === 'past' && event.status === 'Concluído') return true;
        return false;
    }).sort((a, b) => { // Sort by start date desc
        const dateA = a.startDate instanceof Timestamp ? a.startDate.toDate() : new Date(a.startDate);
        const dateB = b.startDate instanceof Timestamp ? b.startDate.toDate() : new Date(b.startDate);
        return dateB.getTime() - dateA.getTime();
    });


    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-2">Carregando eventos...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6">
             <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Calendar className="h-7 w-7" /> Eventos Escolares
            </h1>
            <p className="text-muted-foreground">Fique por dentro dos eventos especiais e ganhe recompensas exclusivas.</p>

             {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
                 <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Todos</Button>
                 <Button variant={filter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('active')}>Ativos</Button>
                 <Button variant={filter === 'upcoming' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('upcoming')}>Próximos</Button>
                 <Button variant={filter === 'past' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('past')}>Passados</Button>
            </div>

            {/* Event List */}
            <div className="space-y-6">
                {filteredEvents.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">Nenhum evento encontrado para este filtro.</p>
                )}
                {filteredEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="p-0 relative">
                             <Image src={event.imageUrl || "https://placehold.co/800x200.png"} alt={event.name} width={800} height={200} className="w-full h-48 object-cover" data-ai-hint="event banner" />
                             <div className="absolute top-4 right-4">
                                 <Badge variant={getStatusBadgeVariant(event.status || 'Agendado')} className="text-xs font-semibold">{event.status}</Badge>
                             </div>
                        </CardHeader>
                        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-3">
                                <CardTitle className="text-2xl text-primary">{event.name}</CardTitle>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                     <span className="flex items-center gap-1"><Clock className="h-4 w-4" />
                                        {(event.startDate instanceof Timestamp ? event.startDate.toDate() : new Date(event.startDate)).toLocaleDateString('pt-BR')}
                                        {' - '}
                                        {(event.endDate instanceof Timestamp ? event.endDate.toDate() : new Date(event.endDate)).toLocaleDateString('pt-BR')}
                                     </span>
                                     {event.status === 'Ativo' && event.bonusMultiplier > 1 && (
                                         <span className="flex items-center gap-1 font-semibold text-accent"><Star className="h-4 w-4 text-yellow-500" /> Bônus de {event.bonusMultiplier}x IFCoins!</span>
                                     )}
                                </div>
                                <p className="text-sm">{event.description}</p>
                            </div>
                            <div className="space-y-3">
                                 <h4 className="font-semibold flex items-center gap-1"><Gift className="h-4 w-4"/> Recompensas Especiais</h4>
                                 {event.displayLinkedCards.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {event.displayLinkedCards.map(card => (
                                             <div key={card.id} className="text-center p-1 border rounded-md bg-secondary/50 w-24">
                                                <Image src={card.imageUrl || "https://placehold.co/100x140.png"} alt={card.name} width={60} height={84} className="mx-auto rounded" data-ai-hint="trading card small" />
                                                 <p className="text-[10px] font-medium truncate mt-1">{card.name}</p>
                                                 <Badge variant="outline" className={`text-[9px] scale-90 ${getRarityClass(card.rarity)}`}>{card.rarity}</Badge>
                                             </div>
                                        ))}
                                    </div>
                                 ) : (
                                    <p className="text-xs text-muted-foreground">Nenhuma carta especial vinculada a este evento.</p>
                                 )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
