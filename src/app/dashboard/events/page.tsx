// src/app/dashboard/events/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Star, Gift, Eye } from "lucide-react";
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

// Mock Data - Replace with actual data fetching
const events = [
    {
        id: "event01",
        name: "Semana da Tecnologia",
        description: "Participe das palestras e workshops para ganhar IFCoins extras e ter a chance de obter cartas exclusivas!",
        startDate: "2024-10-15",
        endDate: "2024-10-20",
        bonusMultiplier: 2,
        status: "Ativo",
        imageUrl: "https://picsum.photos/seed/techweek/400/200",
        linkedCards: [
            { id: "card002", name: "Espírito Tecnológico", rarity: "Lendário", imageUrl: "https://picsum.photos/seed/tech/100/140" }
        ]
    },
    {
        id: "event02",
        name: "Feira de Ciências Interativa",
        description: "Apresente seu projeto ou visite os stands para acumular pontos e moedas. Cartas temáticas disponíveis!",
        startDate: "2024-11-01",
        endDate: "2024-11-05",
        bonusMultiplier: 1.5,
        status: "Agendado",
        imageUrl: "https://picsum.photos/seed/sciencefair/400/200",
        linkedCards: []
    },
    {
        id: "event03",
        name: "Gincana Cultural IFPR",
        description: "Evento concluído. Parabéns às equipes vencedoras!",
        startDate: "2024-09-01",
        endDate: "2024-09-07",
        bonusMultiplier: 1,
        status: "Concluído",
        imageUrl: "https://picsum.photos/seed/gincana/400/200",
        linkedCards: [
             { id: "card010", name: "Troféu Gincana", rarity: "Raro", imageUrl: "https://picsum.photos/seed/trophy/100/140" }
        ]
    },
];

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
     switch (status.toLowerCase()) {
        case 'ativo': return 'default'; // Greenish/Default (or define a success variant)
        case 'agendado': return 'secondary'; // Yellowish/Secondary
        case 'concluído': return 'outline'; // Greyish/Outline
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


export default function EventsPage() {
    const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        if (filter === 'active' && event.status === 'Ativo') return true;
        if (filter === 'upcoming' && event.status === 'Agendado') return true;
        if (filter === 'past' && event.status === 'Concluído') return true;
        return false;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); // Sort by start date desc


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
                             <Image src={event.imageUrl} alt={event.name} width={800} height={200} className="w-full h-48 object-cover" />
                             <div className="absolute top-4 right-4">
                                 <Badge variant={getStatusBadgeVariant(event.status)} className="text-xs font-semibold">{event.status}</Badge>
                             </div>
                        </CardHeader>
                        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-3">
                                <CardTitle className="text-2xl text-primary">{event.name}</CardTitle>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                     <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(event.startDate).toLocaleDateString('pt-BR')} - {new Date(event.endDate).toLocaleDateString('pt-BR')}</span>
                                     {event.status === 'Ativo' && event.bonusMultiplier > 1 && (
                                         <span className="flex items-center gap-1 font-semibold text-accent"><Star className="h-4 w-4 text-yellow-500" /> Bônus de {event.bonusMultiplier}x IFCoins!</span>
                                     )}
                                </div>
                                <p className="text-sm">{event.description}</p>
                            </div>
                            <div className="space-y-3">
                                 <h4 className="font-semibold flex items-center gap-1"><Gift className="h-4 w-4"/> Recompensas Especiais</h4>
                                 {event.linkedCards.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {event.linkedCards.map(card => (
                                             <div key={card.id} className="text-center p-1 border rounded-md bg-secondary/50 w-24">
                                                <Image src={card.imageUrl} alt={card.name} width={60} height={84} className="mx-auto rounded"/>
                                                 <p className="text-[10px] font-medium truncate mt-1">{card.name}</p>
                                                 <Badge variant="outline" className={`text-[9px] scale-90 ${getRarityClass(card.rarity)}`}>{card.rarity}</Badge>
                                             </div>
                                        ))}
                                    </div>
                                 ) : (
                                    <p className="text-xs text-muted-foreground">Nenhuma carta especial vinculada a este evento.</p>
                                 )}
                                {/* Add link to shop if cards are available? */}
                                {/* {event.status === 'Ativo' && event.linkedCards.length > 0 && (
                                     <Button variant="link" size="sm" className="p-0 h-auto text-primary mt-2" onClick={() => window.location.href='/dashboard/shop'}>
                                         <Eye className="mr-1 h-3 w-3"/> Ver na Loja
                                     </Button>
                                )} */}
                            </div>
                        </CardContent>
                        {/* Optional Footer */}
                         {/* <Separator />
                         <CardFooter className="p-4">
                             <Button variant="outline" size="sm">Ver Detalhes</Button>
                         </CardFooter> */}
                    </Card>
                ))}
            </div>
        </div>
    );
}
