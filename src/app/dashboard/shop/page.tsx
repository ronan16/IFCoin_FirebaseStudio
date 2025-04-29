// src/app/dashboard/shop/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, ShoppingCart, Package, Star } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';


// Mock Data - Replace with actual data fetching
const availableCards = [
    { id: "card001", name: "Energia Solar IF", rarity: "Comum", imageUrl: "https://picsum.photos/seed/solar/200/280", price: 5, available: true },
    { id: "card004", name: "Chip Quântico", rarity: "Raro", imageUrl: "https://picsum.photos/seed/chip/200/280", price: 20, available: true },
    { id: "card002", name: "Espírito Tecnológico", rarity: "Lendário", imageUrl: "https://picsum.photos/seed/tech/200/280", price: 100, available: true, quantity: 18 }, // Limited
     { id: "card005", name: "Mascote IF Azul", rarity: "Comum", imageUrl: "https://picsum.photos/seed/mascote_blue/200/280", price: 5, available: true },
      { id: "card006", name: "Livro do Saber", rarity: "Raro", imageUrl: "https://picsum.photos/seed/book/200/280", price: 25, available: false }, // Unavailable example
      { id: "card007", name: "Estrela Mítica", rarity: "Mítico", imageUrl: "https://picsum.photos/seed/mythic/200/280", price: 500, available: true, quantity: 3 }, // Very Limited
];

const availablePacks = [
    { id: "pack001", name: "Pacote Iniciante", description: "Contém 3 cartas comuns.", price: 10, imageUrl: "https://picsum.photos/seed/pack1/200/200" },
    { id: "pack002", name: "Pacote Surpresa Mensal", description: "Chance de raras e lendárias! Limite 1/mês.", price: 50, imageUrl: "https://picsum.photos/seed/pack2/200/200", limitReached: false }, // Add limit logic
];

const userCoins = 150; // Mock user coins

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

export default function ShopPage() {
    const { toast } = useToast();
    const [itemToBuy, setItemToBuy] = useState<any>(null); // Store item details for confirmation

    const handleBuyClick = (item: any) => {
        if (userCoins < item.price) {
            toast({
                title: "IFCoins Insuficientes",
                description: `Você precisa de ${item.price} IFCoins para comprar ${item.name}, mas possui apenas ${userCoins}.`,
                variant: "destructive",
            });
        } else {
            setItemToBuy(item); // Open confirmation dialog
        }
    };

    const confirmPurchase = async () => {
        if (!itemToBuy) return;

        console.log("Attempting to buy:", itemToBuy);
        // TODO: Implement API call to purchase item
        // Deduct coins, add card/pack contents to user's collection/inventory
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

        // Update mock coins (in real app, refetch or update state from API response)
        // userCoins -= itemToBuy.price;

        toast({
            title: "Compra Realizada!",
            description: `Você comprou ${itemToBuy.name} por ${itemToBuy.price} IFCoins.`,
            // Add action to view collection?
             action: <Button variant="link" size="sm" onClick={() => window.location.href='/dashboard/collection'}>Ver Coleção</Button>,
        });

        // If it was a pack, show opening animation/result
        if (itemToBuy.id.startsWith('pack')) {
             // Simulate pack opening result
             await new Promise(resolve => setTimeout(resolve, 500));
             toast({
                 title: "Pacote Aberto!",
                 description: `Você recebeu: Carta Rara x1, Carta Comum x2!`, // Example result
                 variant: "default",
                 duration: 5000, // Longer duration for pack results
             });
        }


        setItemToBuy(null); // Close dialog
    };


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

             {/* Featured Items or Banners (Optional) */}
             {/* <Card className="bg-gradient-to-r from-primary to-blue-700 text-primary-foreground p-6 shadow-lg">
                Content for featured items...
             </Card> */}

            {/* Packs Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Package className="h-6 w-6" /> Pacotes Disponíveis</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availablePacks.map((pack) => (
                        <Card key={pack.id} className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col">
                            <CardHeader className="p-0 relative h-40">
                                <Image src={pack.imageUrl} alt={pack.name} layout="fill" objectFit="cover" />
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
                                <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            className="bg-accent hover:bg-accent/90 text-accent-foreground"
                                            disabled={pack.limitReached}
                                            onClick={() => handleBuyClick(pack)}
                                        >
                                            <ShoppingCart className="mr-2 h-4 w-4" /> {pack.limitReached ? 'Limite Atingido' : 'Comprar'}
                                        </Button>
                                     </AlertDialogTrigger>
                                     {/* Confirmation Dialog Content (reusable structure) */}
                                     {itemToBuy?.id === pack.id && (
                                         <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Compra?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Você deseja comprar "{itemToBuy.name}" por {itemToBuy.price} IFCoins? Seu saldo atual é {userCoins}.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => setItemToBuy(null)}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={confirmPurchase} className="bg-accent hover:bg-accent/90">Confirmar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                     )}
                                 </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>

            <Separator />

            {/* Cards Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Star className="h-6 w-6" /> Cartas Individuais</h2>
                {/* TODO: Add Filtering/Sorting options */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {availableCards.map((card) => (
                         <AlertDialog key={card.id}>
                             <Card className={cn(
                                "overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group",
                                !card.available && "opacity-50 cursor-not-allowed"
                             )}
                                onClick={() => card.available && handleBuyClick(card)} // Trigger dialog only if available
                             >
                                <CardHeader className="p-0 relative aspect-[5/7]"> {/* Aspect ratio for card */}
                                    <Image src={card.imageUrl} alt={card.name} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" />
                                     {card.quantity !== null && card.quantity <= 20 && (
                                        <Badge variant="destructive" className="absolute top-2 right-2 text-xs">Limitado: {card.quantity}</Badge>
                                     )}
                                     {!card.available && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Badge variant="secondary">Indisponível</Badge>
                                        </div>
                                     )}
                                </CardHeader>
                                <CardContent className="p-2 text-center flex-1">
                                    <p className="text-sm font-semibold truncate group-hover:text-primary">{card.name}</p>
                                     <Badge variant="outline" className={`text-xs mt-1 ${getRarityClass(card.rarity)}`}>{card.rarity}</Badge>
                                </CardContent>
                                {card.available && (
                                     <CardFooter className="p-2 flex justify-center bg-muted/50">
                                         <div className="flex items-center gap-1 font-semibold text-yellow-600 text-sm">
                                            <Coins className="h-4 w-4" /> {card.price}
                                         </div>
                                     </CardFooter>
                                )}
                            </Card>
                            {/* Confirmation Dialog for Cards */}
                            {itemToBuy?.id === card.id && card.available && (
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Compra?</AlertDialogTitle>
                                         <AlertDialogDescription>
                                            <div className="flex items-center gap-4">
                                                 <Image src={itemToBuy.imageUrl} alt={itemToBuy.name} width={60} height={84} className="rounded"/>
                                                 <span>
                                                     Deseja comprar a carta "{itemToBuy.name}" ({itemToBuy.rarity}) por {itemToBuy.price} IFCoins? Seu saldo é {userCoins}.
                                                 </span>
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setItemToBuy(null)}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={confirmPurchase} className="bg-accent hover:bg-accent/90">Confirmar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            )}
                         </AlertDialog>
                    ))}
                </div>
            </section>
        </div>
    );
}
