// src/app/dashboard/trades/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Repeat, ArrowRightLeft, CheckCircle, XCircle, PlusCircle, Coins, Search, MinusCircle, Hourglass } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';


// Mock Data - Replace with actual data fetching
const currentUser = { id: "uid1", name: "João Aluno Silva" };

const userOwnedCards = [
    { id: "card001", name: "Energia Solar IF", rarity: "Comum", imageUrl: "https://picsum.photos/seed/solar/60/84", quantity: 3 },
    { id: "card005", name: "Mascote IF Azul", rarity: "Comum", imageUrl: "https://picsum.photos/seed/mascote_blue/60/84", quantity: 1 },
    { id: "card004", name: "Chip Quântico", rarity: "Raro", imageUrl: "https://picsum.photos/seed/chip/60/84", quantity: 2 },
    { id: "card002", name: "Espírito Tecnológico", rarity: "Lendário", imageUrl: "https://picsum.photos/seed/tech/60/84", quantity: 1 },
];

const otherStudents = [
    { id: "uid2", name: "Maria Estudante Souza" },
    { id: "uid3", name: "Pedro Colega Oliveira" },
    { id: "uid4", name: "Ana Amiga Pereira" },
];

const allCards = [ // Assume we can get a list of all cards for requesting
    { id: "card001", name: "Energia Solar IF", rarity: "Comum", imageUrl: "https://picsum.photos/seed/solar/60/84" },
    { id: "card002", name: "Espírito Tecnológico", rarity: "Lendário", imageUrl: "https://picsum.photos/seed/tech/60/84" },
    { id: "card003", name: "Mascote IF Verde", rarity: "Raro", imageUrl: "https://picsum.photos/seed/mascote_green/60/84"},
    { id: "card004", name: "Chip Quântico", rarity: "Raro", imageUrl: "https://picsum.photos/seed/chip/60/84" },
    { id: "card005", name: "Mascote IF Azul", rarity: "Comum", imageUrl: "https://picsum.photos/seed/mascote_blue/60/84"},
    { id: "card006", name: "Livro do Saber", rarity: "Raro", imageUrl: "https://picsum.photos/seed/book/60/84" },
    { id: "card007", name: "Estrela Mítica", rarity: "Mítico", imageUrl: "https://picsum.photos/seed/mythic/60/84" },
    { id: "card008", name: "Placa Mãe Antiga", rarity: "Comum", imageUrl: "https://picsum.photos/seed/mobo/60/84" },
    { id: "card009", name: "Rede Neural", rarity: "Raro", imageUrl: "https://picsum.photos/seed/network/60/84" },
];

const userTrades = [
    { id: "trade123", from: "uid2", to: "uid1", offered: { cards: [{ id: "card003", name: "Mascote IF Verde", quantity: 1 }], coins: 0 }, requested: { cards: [{ id: "card001", name: "Energia Solar IF", quantity: 1 }], coins: 10 }, status: "pending" },
    { id: "trade456", from: "uid1", to: "uid3", offered: { cards: [{ id: "card004", name: "Chip Quântico", quantity: 1 }], coins: 5 }, requested: { cards: [{ id: "card006", name: "Livro do Saber", quantity: 1 }], coins: 0 }, status: "pending" },
    { id: "trade789", from: "uid4", to: "uid1", offered: { cards: [], coins: 20 }, requested: { cards: [{ id: "card005", name: "Mascote IF Azul", quantity: 1 }], coins: 0 }, status: "accepted" },
    { id: "tradeABC", from: "uid1", to: "uid2", offered: { cards: [{ id: "card001", name: "Energia Solar IF", quantity: 1 }], coins: 0 }, requested: { cards: [{ id: "card009", name: "Rede Neural", quantity: 1 }], coins: 0 }, status: "rejected" },
];

const userCoins = 150;

// State for the new trade proposal
type TradeItem = { id: string; name: string; quantity: number; imageUrl: string };
type TradeOffer = { cards: TradeItem[]; coins: number };


export default function TradesPage() {
    const { toast } = useToast();
    const [isProposingTrade, setIsProposingTrade] = useState(false);
    const [tradePartner, setTradePartner] = useState<string>('');
    const [offeredItems, setOfferedItems] = useState<TradeOffer>({ cards: [], coins: 0 });
    const [requestedItems, setRequestedItems] = useState<TradeOffer>({ cards: [], coins: 0 });
    const [cardSearchOffer, setCardSearchOffer] = useState('');
    const [cardSearchRequest, setCardSearchRequest] = useState('');

    const addCardToOffer = (card: any) => {
         // Find the user's owned card details
        const ownedCard = userOwnedCards.find(c => c.id === card.id);
        if (!ownedCard) return; // Should not happen if selection is from owned cards

        const existingCard = offeredItems.cards.find(c => c.id === card.id);
        if (existingCard) {
            if (existingCard.quantity < ownedCard.quantity) {
                setOfferedItems(prev => ({
                    ...prev,
                    cards: prev.cards.map(c => c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c)
                }));
            } else {
                toast({ title: "Quantidade Máxima Atingida", description: `Você só possui ${ownedCard.quantity}x ${card.name}.`, variant: "destructive" });
            }
        } else {
             if (1 <= ownedCard.quantity) {
                 setOfferedItems(prev => ({
                    ...prev,
                    cards: [...prev.cards, { id: card.id, name: card.name, quantity: 1, imageUrl: card.imageUrl }]
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

     const addCardToRequest = (card: any) => {
        const existingCard = requestedItems.cards.find(c => c.id === card.id);
        if (existingCard) {
             // Assuming we can request multiple copies
             setRequestedItems(prev => ({
                 ...prev,
                 cards: prev.cards.map(c => c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c)
             }));
        } else {
             setRequestedItems(prev => ({
                 ...prev,
                 cards: [...prev.cards, { id: card.id, name: card.name, quantity: 1, imageUrl: card.imageUrl }]
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
        if (offeredItems.coins > userCoins) {
             toast({ title: "Saldo Insuficiente", description: `Você não pode oferecer ${offeredItems.coins} IFCoins.`, variant: "destructive" });
             return;
        }

        console.log("Proposing Trade:", {
            from: currentUser.id,
            to: tradePartner,
            offered: offeredItems,
            requested: requestedItems,
        });
        // TODO: Implement API call to propose trade
         await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: "Proposta Enviada!",
            description: "Sua proposta de troca foi enviada com sucesso.",
        });
        // Reset state and close dialog
        setIsProposingTrade(false);
        setTradePartner('');
        setOfferedItems({ cards: [], coins: 0 });
        setRequestedItems({ cards: [], coins: 0 });
        setCardSearchOffer('');
        setCardSearchRequest('');
    };

    const handleTradeAction = async (tradeId: string, action: 'accept' | 'reject') => {
        console.log(`Action ${action} on trade ${tradeId}`);
        // TODO: Implement API call to accept/reject trade
         await new Promise(resolve => setTimeout(resolve, 1000));

         toast({
             title: `Troca ${action === 'accept' ? 'Aceita' : 'Rejeitada'}!`,
             description: `A troca ${tradeId} foi ${action === 'accept' ? 'aceita' : 'rejeitada'}.`,
         });
        // TODO: Update local trade list state or refetch
    };


    const getTradeStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Hourglass className="mr-1 h-3 w-3" />Pendente</Badge>;
            case 'accepted': return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Aceita</Badge>;
            case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejeitada</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const renderTradeItems = (items: TradeOffer) => (
        <div className="flex flex-wrap gap-1 items-center">
            {items.cards.map(card => (
                <TooltipProvider key={card.id}>
                   <Tooltip>
                       <TooltipTrigger>
                           <div className="relative">
                             <Image src={card.imageUrl} alt={card.name} width={24} height={34} className="rounded-sm border" />
                             {card.quantity > 1 && <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 justify-center text-xs rounded-full">{card.quantity}</Badge>}
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

    // Filter cards for selection based on search term
    const filteredOwnedCards = userOwnedCards.filter(card => card.name.toLowerCase().includes(cardSearchOffer.toLowerCase()));
    const filteredAllCards = allCards.filter(card => card.name.toLowerCase().includes(cardSearchRequest.toLowerCase()));


    return (
        <div className="container mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                    <Repeat className="h-7 w-7" /> Trocas de Cartas
                </h1>
                 <Dialog open={isProposingTrade} onOpenChange={setIsProposingTrade}>
                    <DialogTrigger asChild>
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                           <PlusCircle className="mr-2 h-4 w-4" /> Propor Nova Troca
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Propor Nova Troca</DialogTitle>
                            <DialogDescription>Selecione o parceiro e os itens que deseja oferecer e receber.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                             {/* Left Side: Offer */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-green-600">Sua Oferta</h3>
                                <Separator />
                                 {/* Offered Cards Display */}
                                <Label>Cartas Oferecidas</Label>
                                <ScrollArea className="h-24 border rounded-md p-2 bg-green-50/50">
                                     {offeredItems.cards.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhuma carta selecionada.</p>}
                                     <div className="flex flex-wrap gap-2">
                                        {offeredItems.cards.map(card => (
                                            <div key={card.id} className="relative p-1 border rounded bg-white shadow-sm">
                                                <Image src={card.imageUrl} alt={card.name} width={40} height={56} className="rounded-sm" />
                                                 <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 justify-center text-xs rounded-full">{card.quantity}</Badge>
                                                <Button variant="ghost" size="icon" className="absolute -bottom-1 -right-1 h-5 w-5 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => removeCardFromOffer(card.id)}>
                                                    <MinusCircle className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ))}
                                     </div>
                                </ScrollArea>

                                 {/* Select Cards to Offer */}
                                 <div className="space-y-1">
                                      <Label htmlFor="search-offer">Adicionar Cartas da Sua Coleção</Label>
                                      <Input id="search-offer" placeholder="Buscar em sua coleção..." value={cardSearchOffer} onChange={e => setCardSearchOffer(e.target.value)} />
                                 </div>
                                <ScrollArea className="h-40 border rounded-md p-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        {filteredOwnedCards.map(card => (
                                             <button key={card.id} className="relative p-1 border rounded hover:border-primary transition-colors text-center group disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => addCardToOffer(card)}
                                                disabled={(offeredItems.cards.find(c => c.id === card.id)?.quantity ?? 0) >= card.quantity}
                                             >
                                                <Image src={card.imageUrl} alt={card.name} width={50} height={70} className="mx-auto rounded-sm mb-1"/>
                                                <p className="text-[10px] leading-tight font-medium truncate group-hover:text-primary">{card.name}</p>
                                                 <p className="text-[9px] text-muted-foreground">x{card.quantity}</p>
                                                {(offeredItems.cards.find(c => c.id === card.id)?.quantity ?? 0) >= card.quantity && <div className="absolute inset-0 bg-black/30 rounded"></div>}
                                            </button>
                                        ))}
                                        {filteredOwnedCards.length === 0 && <p className="text-xs text-muted-foreground col-span-3 text-center py-4">Nenhuma carta encontrada.</p>}
                                    </div>
                                </ScrollArea>

                                 {/* Offer Coins */}
                                <div className="space-y-1">
                                    <Label htmlFor="offer-coins">Oferecer IFCoins</Label>
                                    <div className="flex items-center gap-2">
                                         <Coins className="h-4 w-4 text-yellow-500"/>
                                         <Input id="offer-coins" type="number" min="0" value={offeredItems.coins} onChange={e => setOfferedItems(prev => ({...prev, coins: parseInt(e.target.value) || 0}))} className="w-24" />
                                         <span className="text-xs text-muted-foreground">Seu saldo: {userCoins}</span>
                                    </div>
                                     {offeredItems.coins > userCoins && <p className="text-xs text-destructive">Saldo insuficiente.</p>}
                                </div>
                            </div>

                             {/* Right Side: Request */}
                             <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-blue-600">Seu Pedido</h3>
                                <Separator />
                                 {/* Requested Cards Display */}
                                <Label>Cartas Pedidas</Label>
                                <ScrollArea className="h-24 border rounded-md p-2 bg-blue-50/50">
                                     {requestedItems.cards.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhuma carta selecionada.</p>}
                                    <div className="flex flex-wrap gap-2">
                                        {requestedItems.cards.map(card => (
                                            <div key={card.id} className="relative p-1 border rounded bg-white shadow-sm">
                                                <Image src={card.imageUrl} alt={card.name} width={40} height={56} className="rounded-sm" />
                                                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 justify-center text-xs rounded-full">{card.quantity}</Badge>
                                                <Button variant="ghost" size="icon" className="absolute -bottom-1 -right-1 h-5 w-5 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => removeCardFromRequest(card.id)}>
                                                    <MinusCircle className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                {/* Select Cards to Request */}
                                 <div className="space-y-1">
                                    <Label htmlFor="search-request">Adicionar Cartas para Pedir</Label>
                                    <Input id="search-request" placeholder="Buscar todas as cartas..." value={cardSearchRequest} onChange={e => setCardSearchRequest(e.target.value)} />
                                 </div>
                                <ScrollArea className="h-40 border rounded-md p-2">
                                     <div className="grid grid-cols-3 gap-2">
                                        {filteredAllCards.map(card => (
                                            <button key={card.id} className="relative p-1 border rounded hover:border-primary transition-colors text-center group" onClick={() => addCardToRequest(card)}>
                                                <Image src={card.imageUrl} alt={card.name} width={50} height={70} className="mx-auto rounded-sm mb-1"/>
                                                <p className="text-[10px] leading-tight font-medium truncate group-hover:text-primary">{card.name}</p>
                                            </button>
                                        ))}
                                         {filteredAllCards.length === 0 && <p className="text-xs text-muted-foreground col-span-3 text-center py-4">Nenhuma carta encontrada.</p>}
                                    </div>
                                </ScrollArea>


                                 {/* Request Coins */}
                                <div className="space-y-1">
                                    <Label htmlFor="request-coins">Pedir IFCoins</Label>
                                     <div className="flex items-center gap-2">
                                         <Coins className="h-4 w-4 text-yellow-500"/>
                                         <Input id="request-coins" type="number" min="0" value={requestedItems.coins} onChange={e => setRequestedItems(prev => ({...prev, coins: parseInt(e.target.value) || 0}))} className="w-24" />
                                     </div>
                                </div>
                            </div>
                        </div>
                         <Separator />
                        {/* Trade Partner Selection */}
                        <div className="pt-4 space-y-2">
                            <Label htmlFor="trade-partner">Parceiro de Troca</Label>
                             <Select value={tradePartner} onValueChange={setTradePartner}>
                                <SelectTrigger id="trade-partner">
                                    <SelectValue placeholder="Selecione com quem você quer trocar" />
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
                                <Button variant="outline">Cancelar</Button>
                             </DialogClose>
                            <Button onClick={handleProposeTrade} className="bg-accent hover:bg-accent/90">
                                Enviar Proposta
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
            </div>

            {/* Trade List */}
            <Card>
                <CardHeader>
                    <CardTitle>Minhas Trocas</CardTitle>
                     <CardDescription>Gerencie suas propostas enviadas e recebidas.</CardDescription>
                     {/* TODO: Add Tabs for Pending / History? */}
                </CardHeader>
                <CardContent>
                     <ScrollArea className="h-[50vh]"> {/* Adjust height as needed */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>De/Para</TableHead>
                                    <TableHead>Oferecido</TableHead>
                                    <TableHead>Pedido</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userTrades.map((trade) => {
                                    const isOutgoing = trade.from === currentUser.id;
                                    const partnerId = isOutgoing ? trade.to : trade.from;
                                    const partner = otherStudents.find(s => s.id === partnerId) || { name: 'Usuário Desconhecido' };

                                    return (
                                        <TableRow key={trade.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    {isOutgoing ? <ArrowRightLeft size={14} className="text-blue-500"/> : <ArrowRightLeft size={14} className="text-green-500"/>}
                                                    <span className="font-medium">{partner.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{renderTradeItems(trade.offered)}</TableCell>
                                            <TableCell>{renderTradeItems(trade.requested)}</TableCell>
                                            <TableCell>{getTradeStatusBadge(trade.status)}</TableCell>
                                            <TableCell className="text-right">
                                                {trade.status === 'pending' && !isOutgoing && (
                                                    <div className="flex gap-2 justify-end">
                                                         <Button size="sm" variant="ghost" className="h-7 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleTradeAction(trade.id, 'accept')}>
                                                             <CheckCircle className="h-4 w-4" />
                                                         </Button>
                                                         <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleTradeAction(trade.id, 'reject')}>
                                                             <XCircle className="h-4 w-4" />
                                                         </Button>
                                                    </div>
                                                )}
                                                 {trade.status === 'pending' && isOutgoing && (
                                                      <Button size="sm" variant="ghost" className="h-7 text-muted-foreground" disabled>Aguardando</Button>
                                                    // TODO: Add cancel button?
                                                 )}
                                                 {trade.status !== 'pending' && (
                                                      <Button size="sm" variant="ghost" className="h-7 text-muted-foreground" disabled>Concluída</Button>
                                                 )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {userTrades.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Você ainda não tem nenhuma troca.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                     </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

// Tooltip components (basic placeholders, use shadcn versions)
const TooltipProvider = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const Tooltip = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const TooltipTrigger = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const TooltipContent = ({ children }: { children: React.ReactNode }) => <div className="hidden group-hover:block absolute bg-black text-white p-1 rounded text-xs z-10">{children}</div>;
