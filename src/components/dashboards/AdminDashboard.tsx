
// src/components/dashboards/AdminDashboard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, CreditCard, CalendarPlus, Settings, BarChart3, Upload, Star, Users, AlertTriangle, Coins, Loader2, Edit3, Trash2, ImageIcon, UserCircle } from "lucide-react"; // Changed UploadCloud
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from "@/components/ui/switch";
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { db, serverTimestamp } from '@/lib/firebase/firebase'; // Storage removed from direct import
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
// Firebase Storage imports are no longer needed here
// import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; 
import NextImage from 'next/image'; 
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

const coursesList = ["Informática", "Eletrotécnica", "Agroecologia", "Agropecuária", "Sistemas de Informação", "Eng. Agronômica", "Física"];
const turmasList = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "TEC1", "TEC2", "N/A"];

interface UserData {
    id: string;
    name: string;
    ra?: string;
    email: string;
    role: 'student' | 'teacher' | 'admin' | 'staff';
    status?: 'Ativo' | 'Pendente' | 'Inativo';
    coins?: number;
    course?: string;
    turma?: string;
    avatarUrl?: string; 
}

interface CardData {
    id: string;
    name: string;
    rarity: "Comum" | "Raro" | "Lendário" | "Mítico";
    imageUrl: string;
    // imagePath?: string; // No longer needed
    available: boolean;
    copiesAvailable?: number | null;
    eventId?: string | null;
    price?: number;
}

interface EventData {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    imageUrl: string;
    // imagePath?: string; // No longer needed
    description: string;
    bonusMultiplier: number;
    status?: 'Ativo' | 'Agendado' | 'Concluído';
    linkedCards?: string[];
}

const NO_EVENT_SELECTED_VALUE = "_NONE_";
// Constants for file validation are no longer needed

const userManagementSchema = z.object({
    name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
    ra: z.string().regex(/^[a-zA-Z0-9]*$/, { message: "RA deve conter apenas letras e números ou estar vazio." }).optional().or(z.literal('')),
    email: z.string().email({ message: "Email inválido." }),
    course: z.string().min(1, { message: "Selecione um curso." }),
    turma: z.string().min(1, { message: "Selecione uma turma." }),
    role: z.enum(['student', 'teacher', 'staff', 'admin']).default('student'),
    avatarUrl: z.string().url({ message: "URL do avatar inválida." }).optional().or(z.literal('')),
});

const cardSchema = z.object({
    name: z.string().min(3, "Nome da carta deve ter pelo menos 3 caracteres."),
    rarity: z.enum(["Comum", "Raro", "Lendário", "Mítico"]),
    price: z.coerce.number().min(0, "Preço deve ser positivo ou zero.").optional().default(0),
    imageUrl: z.string().url({ message: "URL da imagem inválida."}).optional().or(z.literal('')).default("https://placehold.co/200x280.png"),
    available: z.boolean().default(true),
    copiesAvailable: z.coerce.number().int("Deve ser um número inteiro.").positive("Deve ser positivo.").optional().nullable().transform(val => val === undefined || val === null || isNaN(val) ? null : Number(val)),
    eventId: z.string().optional().nullable().transform(val => (val === "" || val === undefined || val === NO_EVENT_SELECTED_VALUE) ? null : val),
});

const eventSchema = z.object({
    name: z.string().min(3, "Nome do evento é muito curto."),
    description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres.").optional().or(z.literal('')),
    imageUrl: z.string().url({ message: "URL da imagem inválida."}).optional().or(z.literal('')).default("https://placehold.co/400x200.png"),
    startDate: z.date({ required_error: "Data de início é obrigatória." }),
    endDate: z.date({ required_error: "Data de término é obrigatória." }),
    bonusMultiplier: z.coerce.number().min(1, "Multiplicador deve ser no mínimo 1.").max(20, "Multiplicador máximo é 20.").default(1),
    linkedCards: z.array(z.string()).optional(),
}).refine((data) => data.endDate >= data.startDate, {
    message: "Data de término deve ser igual ou posterior à data de início.",
    path: ["endDate"],
});


export function AdminDashboard() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('users');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isFormProcessing, setIsFormProcessing] = useState(false);

    const [users, setUsers] = useState<UserData[]>([]);
    const [cards, setCards] = useState<CardData[]>([]);
    const [events, setEvents] = useState<EventData[]>([]);

    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editingCard, setEditingCard] = useState<CardData | null>(null);
    const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
    
    // Image preview states are still useful for URL inputs
    const [cardImagePreview, setCardImagePreview] = useState<string | null>("https://placehold.co/200x280.png");
    const [eventImagePreview, setEventImagePreview] = useState<string | null>("https://placehold.co/400x200.png");
    const [userAvatarPreview, setUserAvatarPreview] = useState<string | null>(null);


    const [usersLoaded, setUsersLoaded] = useState(false);
    const [cardsLoaded, setCardsLoaded] = useState(false);
    const [eventsLoaded, setEventsLoaded] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
            setUsers(usersData);
            setUsersLoaded(true);
        }, (error) => {
            console.error("Error fetching users: ", error);
            toast({ title: "Erro ao buscar usuários", description: error.message, variant: "destructive" });
            setUsersLoaded(true);
        });
        return () => unsubscribe();
    }, [toast]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "cards"), (snapshot) => {
            const cardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardData));
            setCards(cardsData);
            setCardsLoaded(true);
        }, (error) => {
            console.error("Error fetching cards: ", error);
            toast({ title: "Erro ao buscar cartas", description: error.message, variant: "destructive" });
            setCardsLoaded(true);
        });
        return () => unsubscribe();
    }, [toast]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
            const eventsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate),
                    endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate),
                } as EventData;
            });
            setEvents(eventsData);
            setEventsLoaded(true);
        }, (error) => {
            console.error("Error fetching events: ", error);
            toast({ title: "Erro ao buscar eventos", description: error.message, variant: "destructive" });
            setEventsLoaded(true);
        });
        return () => unsubscribe();
    }, [toast]);

     useEffect(() => {
        if (usersLoaded && cardsLoaded && eventsLoaded) {
            setIsInitialLoading(false);
        }
    }, [usersLoaded, cardsLoaded, eventsLoaded]);


    const cardForm = useForm<z.infer<typeof cardSchema>>({
        resolver: zodResolver(cardSchema),
        defaultValues: { name: "", rarity: "Comum", price: 0, imageUrl: "https://placehold.co/200x280.png", available: true, copiesAvailable: null, eventId: null },
    });

    const eventForm = useForm<z.infer<typeof eventSchema>>({
        resolver: zodResolver(eventSchema),
        defaultValues: { name: "", description: "", imageUrl: "https://placehold.co/400x200.png", startDate: undefined, endDate: undefined, bonusMultiplier: 1, linkedCards: [] },
    });

    const userForm = useForm<z.infer<typeof userManagementSchema>>({
        resolver: zodResolver(userManagementSchema),
        defaultValues: { name: "", ra: "", email: "", course: "", turma: "", role: "student", avatarUrl: "" },
    });
    
    // Update image previews based on URL input fields
    const cardImageUrlValue = cardForm.watch("imageUrl");
    useEffect(() => {
        if (cardImageUrlValue && cardImageUrlValue.startsWith('http')) {
            setCardImagePreview(cardImageUrlValue);
        } else if (!editingCard) { // only reset to placeholder if not editing or url is invalid
            setCardImagePreview("https://placehold.co/200x280.png");
        }
    }, [cardImageUrlValue, editingCard]);

    const eventImageUrlValue = eventForm.watch("imageUrl");
    useEffect(() => {
        if (eventImageUrlValue && eventImageUrlValue.startsWith('http')) {
            setEventImagePreview(eventImageUrlValue);
        } else if (!editingEvent) {
            setEventImagePreview("https://placehold.co/400x200.png");
        }
    }, [eventImageUrlValue, editingEvent]);
    
    const userAvatarUrlValue = userForm.watch("avatarUrl");
    useEffect(() => {
        if (userAvatarUrlValue && userAvatarUrlValue.startsWith('http')) {
            setUserAvatarPreview(userAvatarUrlValue);
        } else if (!editingUser) {
            setUserAvatarPreview(null);
        }
    }, [userAvatarUrlValue, editingUser]);


    useEffect(() => {
        if (editingCard) {
            cardForm.reset({
                ...editingCard,
                price: editingCard.price === undefined || editingCard.price === null || isNaN(editingCard.price) ? 0 : Number(editingCard.price),
                copiesAvailable: editingCard.copiesAvailable === undefined ? null : editingCard.copiesAvailable,
                eventId: editingCard.eventId === undefined || editingCard.eventId === NO_EVENT_SELECTED_VALUE ? null : editingCard.eventId,
                imageUrl: editingCard.imageUrl || "https://placehold.co/200x280.png",
            });
            setCardImagePreview(editingCard.imageUrl || "https://placehold.co/200x280.png");
        } else {
             cardForm.reset({ name: "", rarity: "Comum", price: 0, imageUrl: "https://placehold.co/200x280.png", available: true, copiesAvailable: null, eventId: null });
             setCardImagePreview("https://placehold.co/200x280.png");
        }
    }, [editingCard, cardForm]);

    useEffect(() => {
        if (editingEvent) {
             eventForm.reset({
                ...editingEvent,
                startDate: editingEvent.startDate instanceof Date ? editingEvent.startDate : new Date(editingEvent.startDate),
                endDate: editingEvent.endDate instanceof Date ? editingEvent.endDate : new Date(editingEvent.endDate),
                bonusMultiplier: editingEvent.bonusMultiplier === undefined || editingEvent.bonusMultiplier === null || isNaN(editingEvent.bonusMultiplier) ? 1 : Number(editingEvent.bonusMultiplier),
                imageUrl: editingEvent.imageUrl || "https://placehold.co/400x200.png",
            });
            setEventImagePreview(editingEvent.imageUrl || "https://placehold.co/400x200.png");
        } else {
            eventForm.reset({ name: "", description: "", imageUrl: "https://placehold.co/400x200.png", startDate: undefined, endDate: undefined, bonusMultiplier: 1, linkedCards: []});
            setEventImagePreview("https://placehold.co/400x200.png");
        }
    }, [editingEvent, eventForm]);

    useEffect(() => {
        if (editingUser) {
            userForm.reset({
                ...editingUser,
                ra: editingUser.ra || "", 
                course: editingUser.course || "",
                turma: editingUser.turma || "",
                avatarUrl: editingUser.avatarUrl || "",
            });
            setUserAvatarPreview(editingUser.avatarUrl || null);
        } else {
            userForm.reset({ name: "", ra: "", email: "", course: "", turma:"", role: "student", avatarUrl: "" });
            setUserAvatarPreview(null);
        }
    }, [editingUser, userForm]);
    

    async function onCardSubmit(values: z.infer<typeof cardSchema>) {
        setIsFormProcessing(true);
        try {
            const dataToSave = {
                name: values.name,
                rarity: values.rarity,
                price: values.price === undefined || values.price === null || isNaN(values.price) ? 0 : Number(values.price),
                imageUrl: values.imageUrl || "https://placehold.co/200x280.png", // Use provided URL or placeholder
                available: values.available,
                copiesAvailable: values.copiesAvailable === undefined ? null : values.copiesAvailable,
                eventId: values.eventId === undefined || values.eventId === NO_EVENT_SELECTED_VALUE ? null : values.eventId,
            };

            if (editingCard) {
                await updateDoc(doc(db, "cards", editingCard.id), dataToSave);
                toast({ title: "Carta Atualizada!", description: `A carta "${values.name}" foi atualizada.` });
            } else {
                await addDoc(collection(db, "cards"), dataToSave);
                toast({ title: "Carta Registrada!", description: `A carta "${values.name}" foi adicionada.` });
            }
            cardForm.reset({ name: "", rarity: "Comum", price: 0, imageUrl: "https://placehold.co/200x280.png", available: true, copiesAvailable: null, eventId: null });
            setCardImagePreview("https://placehold.co/200x280.png");
            setEditingCard(null);
        } catch (error: any) {
            console.error("Card submission error: ", error);
            toast({ title: "Erro ao Salvar Carta", description: error.message, variant: "destructive" });
        } finally {
            setIsFormProcessing(false);
        }
    }

    async function deleteCard(cardToDelete: CardData) {
        setIsFormProcessing(true);
        try {
            // No need to delete from storage as we are using URLs
            await deleteDoc(doc(db, "cards", cardToDelete.id));
            toast({ title: "Carta Excluída!", description: "A carta foi removida do sistema." });
        } catch (error: any) {
            toast({ title: "Erro ao Excluir Carta", description: error.message, variant: "destructive" });
        } finally {
            setIsFormProcessing(false);
        }
    }

     async function onEventSubmit(values: z.infer<typeof eventSchema>) {
        setIsFormProcessing(true);
        try {
            const eventDataToSave = {
                name: values.name,
                description: values.description,
                imageUrl: values.imageUrl || "https://placehold.co/400x200.png",
                startDate: Timestamp.fromDate(values.startDate),
                endDate: Timestamp.fromDate(values.endDate),
                bonusMultiplier: values.bonusMultiplier === undefined || values.bonusMultiplier === null || isNaN(values.bonusMultiplier) ? 1 : Number(values.bonusMultiplier),
                linkedCards: values.linkedCards || [],
            };

            if (editingEvent) {
                await updateDoc(doc(db, "events", editingEvent.id), eventDataToSave);
                toast({ title: "Evento Atualizado!", description: `O evento "${values.name}" foi salvo.` });
            } else {
                await addDoc(collection(db, "events"), eventDataToSave);
                toast({ title: "Evento Criado!", description: `O evento "${values.name}" foi criado.` });
            }
            eventForm.reset({ name: "", description: "", imageUrl: "https://placehold.co/400x200.png", startDate: undefined, endDate: undefined, bonusMultiplier: 1, linkedCards: []});
            setEventImagePreview("https://placehold.co/400x200.png");
            setEditingEvent(null);
        } catch (error: any) {
            console.error("Event submission error: ", error);
            toast({ title: "Erro ao Salvar Evento", description: error.message, variant: "destructive" });
        } finally {
            setIsFormProcessing(false);
        }
    }

    async function deleteEvent(eventToDelete: EventData) {
        setIsFormProcessing(true);
        try {
            // No need to delete from storage
            await deleteDoc(doc(db, "events", eventToDelete.id));
            toast({ title: "Evento Excluído!", description: "O evento foi removido do sistema." });
        } catch (error: any) {
            toast({ title: "Erro ao Excluir Evento", description: error.message, variant: "destructive" });
        } finally {
            setIsFormProcessing(false);
        }
    }

    async function onUserSubmit(values: z.infer<typeof userManagementSchema>) {
        setIsFormProcessing(true);
        try {
            if (editingUser) {
                await updateDoc(doc(db, "users", editingUser.id), {
                    name: values.name,
                    ra: values.ra,
                    email: values.email, 
                    course: values.course,
                    turma: values.turma,
                    role: values.role,
                    avatarUrl: values.avatarUrl || "", 
                });
                toast({ title: "Usuário Atualizado!", description: `Os dados de "${values.name}" foram atualizados.` });
            } else {
                toast({ title: "Ação não suportada", description: "Criação de novos usuários por aqui não é o método principal. Use a tela de registro.", variant: "destructive" });
            }
            userForm.reset({ name: "", ra: "", email: "", course: "", turma:"", role: "student", avatarUrl: "" });
            setUserAvatarPreview(null);
            setEditingUser(null);
        } catch (error: any) {
            toast({ title: "Erro ao Salvar Usuário", description: error.message, variant: "destructive" });
        } finally {
            setIsFormProcessing(false);
        }
    }

     async function handleStudentRegistration(data: any) {
        console.log("Registering students from CSV (placeholder):", data);
        setIsFormProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsFormProcessing(false);
        toast({ title: "Funcionalidade em Desenvolvimento", description: "Upload de CSV para pré-registro será implementado." });
     }

     const getEventStatus = (event: EventData): 'Ativo' | 'Agendado' | 'Concluído' => {
        const now = new Date();
        const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
        const endDate = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);

        if (endDate < now) return 'Concluído';
        if (startDate > now) return 'Agendado';
        return 'Ativo';
    };


    const renderContent = () => {
        if (isInitialLoading) {
            return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Carregando dados...</div>;
        }

        switch (activeTab) {
            case 'users':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Gerenciar Usuários</CardTitle>
                            <CardDescription>Visualizar e editar usuários cadastrados no sistema.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {editingUser && (
                                 <Form {...userForm} key={`user-form-${editingUser.id}`}>
                                    <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4 p-4 border rounded-lg shadow-sm mb-6 bg-secondary/30">
                                        <h3 className="text-lg font-semibold mb-2">Editando Usuário: {editingUser.name}</h3>
                                        <FormField
                                            control={userForm.control}
                                            name="avatarUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>URL da Foto de Perfil</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-4">
                                                    {userAvatarPreview ? (
                                                        <NextImage src={userAvatarPreview} alt="Prévia do Avatar" width={64} height={64} className="rounded-full object-cover h-16 w-16" data-ai-hint="user avatar" />
                                                    ) : (
                                                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                            <UserCircle size={32} />
                                                        </div>
                                                    )}
                                                    <Input 
                                                        type="url" 
                                                        placeholder="https://exemplo.com/avatar.png"
                                                        {...field}
                                                        className="block w-full"
                                                    />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField control={userForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={userForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email (não editável aqui)</FormLabel><FormControl><Input type="email" {...field} readOnly disabled /></FormControl><FormDescription className="text-xs">Para alterar email, o usuário deve usar as opções de autenticação.</FormDescription><FormMessage /></FormItem>)} />
                                         <FormField control={userForm.control} name="ra" render={({ field }) => (<FormItem><FormLabel>RA</FormLabel><FormControl><Input placeholder="Ex: 20251IVA10030013" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                         <FormField control={userForm.control} name="course" render={({ field }) => ( <FormItem><FormLabel>Curso</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger></FormControl><SelectContent>{coursesList.map((courseName) => (<SelectItem key={courseName} value={courseName}>{courseName}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                         <FormField control={userForm.control} name="turma" render={({ field }) => ( <FormItem><FormLabel>Turma</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger></FormControl><SelectContent>{turmasList.map((turmaName) => ( <SelectItem key={turmaName} value={turmaName}>{turmaName}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                         <FormField control={userForm.control} name="role" render={({ field }) => (<FormItem><FormLabel>Função</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="student">Aluno</SelectItem><SelectItem value="teacher">Professor</SelectItem><SelectItem value="staff">Servidor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={isFormProcessing} className="bg-accent hover:bg-accent/90 text-accent-foreground"> {isFormProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />} Salvar Usuário</Button>
                                            <Button variant="outline" onClick={() => { setEditingUser(null); userForm.reset({ name: "", ra: "", email: "", course: "", turma: "", role: "student", avatarUrl: "" }); setUserAvatarPreview(null); }} disabled={isFormProcessing}>Cancelar</Button>
                                        </div>
                                    </form>
                                </Form>
                            )}
                             <div>
                                <Label htmlFor="student-upload" className="text-sm font-medium">Pré-Registro em Massa (CSV)</Label>
                                <div className="flex items-center gap-2 mt-1">
                                     <Input id="student-upload" type="file" accept=".csv" className="flex-1" disabled={isFormProcessing}/>
                                     <Button size="sm" onClick={() => handleStudentRegistration({})} disabled={isFormProcessing}>
                                        {isFormProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />} Enviar Arquivo (Em Breve)
                                     </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Formato esperado: RA, Email, Nome Completo, Curso, Turma (Opcional)</p>
                            </div>
                            <Separator />
                             <h3 className="text-lg font-semibold">Usuários Registrados ({users.length})</h3>
                             <ScrollArea className="h-[400px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[60px]">Avatar</TableHead>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>RA</TableHead>
                                            <TableHead>Curso</TableHead>
                                            <TableHead>Turma</TableHead>
                                            <TableHead>Função</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <NextImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.email}.png?size=40`} alt={user.name} width={40} height={40} className="rounded-full object-cover" data-ai-hint="user avatar" />
                                                </TableCell>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.ra || '-'}</TableCell>
                                                <TableCell>{user.course || '-'}</TableCell>
                                                <TableCell>{user.turma || '-'}</TableCell>
                                                <TableCell><Badge variant="secondary" className="capitalize">{user.role}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)} className="hover:text-primary" disabled={isFormProcessing}>
                                                        <Edit3 className="h-4 w-4"/>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {users.length === 0 && !isInitialLoading && (
                                            <TableRow><TableCell colSpan={8} className="text-center py-4">Nenhum usuário encontrado.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                             </ScrollArea>
                        </CardContent>
                    </Card>
                );
            case 'cards':
                 return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Gerenciar Cartas Colecionáveis</CardTitle>
                            <CardDescription>{editingCard ? `Editando Carta: ${editingCard.name}` : "Adicionar novas cartas e gerenciar as existentes."}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <Form {...cardForm} key={editingCard ? `card-form-${editingCard.id}` : 'card-form-new'}>
                                <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-4 p-4 border rounded-lg shadow-sm bg-secondary/30">
                                     <h3 className="text-lg font-semibold mb-2">{editingCard ? "Editar Carta" : "Adicionar Nova Carta"}</h3>
                                    <FormField control={cardForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Carta</FormLabel><FormControl><Input placeholder="Ex: Mascote IFPR Raro" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField
                                        control={cardForm.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>URL da Imagem da Carta</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-4">
                                                {cardImagePreview && cardImagePreview.startsWith('http') ? (
                                                    <NextImage src={cardImagePreview} alt="Prévia da Carta" width={100} height={140} className="rounded-md border object-contain h-36 w-auto" data-ai-hint="card game preview" />
                                                ) : (
                                                     <div className="h-36 w-24 rounded-md bg-muted flex items-center justify-center text-muted-foreground"><ImageIcon size={32}/></div>
                                                )}
                                                <Input 
                                                    type="url" 
                                                    placeholder="https://exemplo.com/imagem.png"
                                                    {...field}
                                                    className="block w-full"
                                                />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField control={cardForm.control} name="rarity" render={({ field }) => (<FormItem><FormLabel>Raridade</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a raridade" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Comum">Comum</SelectItem><SelectItem value="Raro">Raro</SelectItem><SelectItem value="Lendário">Lendário</SelectItem><SelectItem value="Mítico">Mítico</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                     <FormField control={cardForm.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Preço na Loja (IFCoins)</FormLabel><FormControl><Input type="number" placeholder="Ex: 10" {...field} value={(field.value !== undefined && field.value !== null && !isNaN(field.value as number)) ? String(field.value) : ''} onChange={e => { const stringValue = e.target.value; field.onChange(stringValue === '' ? undefined : stringValue); }} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={cardForm.control} name="copiesAvailable"  render={({ field }) => ( <FormItem><FormLabel>Cópias Disponíveis (Opcional)</FormLabel><FormControl><Input type="number" placeholder="Deixe em branco para ilimitado" {...field}  value={field.value === undefined || field.value === null || isNaN(field.value as number) ? '' : String(field.value)} onChange={e => { const val = e.target.value; field.onChange(val === '' ? null : parseInt(val, 10));  }} /></FormControl><FormDescription className="text-xs">Para cartas com estoque limitado na loja. Deixe vazio para ilimitado.</FormDescription><FormMessage /></FormItem>)} />
                                     <FormField control={cardForm.control} name="eventId" render={({ field }) => (<FormItem><FormLabel>Vincular a Evento (Opcional)</FormLabel><Select onValueChange={(selectedValue) => { field.onChange(selectedValue === NO_EVENT_SELECTED_VALUE ? null : selectedValue); }} value={field.value ?? NO_EVENT_SELECTED_VALUE}><FormControl><SelectTrigger><SelectValue placeholder="Nenhum evento selecionado" /></SelectTrigger></FormControl><SelectContent><SelectItem value={NO_EVENT_SELECTED_VALUE}>Nenhum</SelectItem>{events.map(event => (<SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>))}</SelectContent></Select><FormDescription className="text-xs">Carta disponível na loja apenas durante este evento (se ativo).</FormDescription><FormMessage /></FormItem>)} />
                                     <FormField control={cardForm.control} name="available" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>Disponível na Loja Geral?</FormLabel><FormDescription className="text-xs">Se esta carta pode ser comprada na loja (mesmo fora de evento, se não houver evento vinculado).</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={isFormProcessing} className="bg-accent hover:bg-accent/90 text-accent-foreground"> {isFormProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CreditCard className="mr-2 h-4 w-4" />} {editingCard ? "Salvar Alterações" : "Adicionar Carta"}</Button>
                                        {editingCard && <Button variant="outline" onClick={() => { setEditingCard(null); cardForm.reset({ name: "", rarity: "Comum", price: 0, imageUrl: "https://placehold.co/200x280.png", available: true, copiesAvailable: null, eventId: null }); setCardImagePreview("https://placehold.co/200x280.png"); }} disabled={isFormProcessing}>Cancelar Edição</Button>}
                                    </div>
                                </form>
                            </Form>
                             <Separator />
                            <h3 className="text-lg font-semibold">Cartas Registradas ({cards.length})</h3>
                             <ScrollArea className="h-[400px]">
                                <Table>
                                     <TableHeader><TableRow><TableHead className="w-[80px]">Imagem</TableHead><TableHead>Nome</TableHead><TableHead>Raridade</TableHead><TableHead>Preço</TableHead><TableHead>Disponível</TableHead><TableHead>Qtde.</TableHead><TableHead>Evento Vinculado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {cards.map((card) => (
                                            <TableRow key={card.id}>
                                                <TableCell>
                                                    <NextImage src={card.imageUrl || "https://placehold.co/50x70.png"} alt={card.name} width={50} height={70} className="rounded-sm border object-cover" data-ai-hint="card game" />
                                                </TableCell>
                                                <TableCell className="font-medium">{card.name}</TableCell>
                                                <TableCell><Badge variant={ card.rarity === 'Mítico' ? 'destructive' : card.rarity === 'Lendário' ? 'default' : card.rarity === 'Raro' ? 'secondary' : 'outline' } className={ card.rarity === 'Lendário' ? "bg-yellow-400 text-black" : "" }>{card.rarity}</Badge></TableCell>
                                                <TableCell>{card.price || 0} <Coins className="inline h-3 w-3 text-yellow-500 -mt-1" /></TableCell>
                                                <TableCell>{card.available ? 'Sim' : 'Não'}</TableCell>
                                                <TableCell>{card.copiesAvailable ?? 'ထ'}</TableCell>
                                                <TableCell>{card.eventId ? events.find(e => e.id === card.eventId)?.name || 'Evento não encontrado' : '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingCard(card)} className="hover:text-primary" disabled={isFormProcessing}><Edit3 className="h-4 w-4"/></Button>
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="hover:text-destructive" disabled={isFormProcessing}><Trash2 className="h-4 w-4"/></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a carta "{card.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteCard(card)} className="bg-destructive hover:bg-destructive/90" disabled={isFormProcessing}>Excluir</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {cards.length === 0 && !isInitialLoading && (
                                            <TableRow><TableCell colSpan={8} className="text-center py-4">Nenhuma carta registrada.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                             </ScrollArea>
                        </CardContent>
                    </Card>
                );
            case 'events':
                 return (
                    <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2"><CalendarPlus className="h-5 w-5" /> Gerenciar Eventos</CardTitle>
                            <CardDescription>{editingEvent ? `Editando Evento: ${editingEvent.name}`: "Criar e gerenciar eventos especiais."}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <Form {...eventForm} key={editingEvent ? `event-form-${editingEvent.id}` : 'event-form-new'}>
                                <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-4 p-4 border rounded-lg shadow-sm bg-secondary/30">
                                     <h3 className="text-lg font-semibold mb-2">{editingEvent ? "Editar Evento" : "Criar Novo Evento"}</h3>
                                     <FormField control={eventForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Evento</FormLabel><FormControl><Input placeholder="Ex: Semana da Cultura Nerd" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField
                                        control={eventForm.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>URL da Imagem do Evento</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-4">
                                                {eventImagePreview && eventImagePreview.startsWith('http') ? (
                                                    <NextImage src={eventImagePreview} alt="Prévia do Evento" width={160} height={90} className="rounded-md border object-contain h-24 w-auto" data-ai-hint="event banner preview" />
                                                ) : (
                                                    <div className="h-24 w-40 rounded-md bg-muted flex items-center justify-center text-muted-foreground"><ImageIcon size={32}/></div>
                                                )}
                                                <Input 
                                                    type="url" 
                                                    placeholder="https://exemplo.com/banner.png"
                                                    {...field}
                                                    className="block w-full"
                                                />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField control={eventForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição do Evento</FormLabel><FormControl><Textarea placeholder="Detalhes sobre o evento, como participar, etc." rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={eventForm.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><DatePicker date={field.value} setDate={field.onChange} /><FormMessage /></FormItem>)} />
                                         <FormField control={eventForm.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Término</FormLabel><DatePicker date={field.value} setDate={field.onChange} /><FormMessage /></FormItem>)} />
                                    </div>
                                     <FormField control={eventForm.control} name="bonusMultiplier" render={({ field }) => ( <FormItem><FormLabel>Multiplicador de Bônus de IFCoins</FormLabel><FormControl><Input type="number" min="1" max="20" step="0.1" placeholder="Ex: 1.5 (para 50% a mais)" {...field} value={(field.value !== undefined && field.value !== null && !isNaN(field.value as number)) ? String(field.value) : ''} onChange={e => { const val = e.target.value; field.onChange(val === '' ? undefined : parseFloat(val)); }} /></FormControl><FormDescription className="text-xs">Quantas vezes mais moedas serão ganhas durante o evento (ex: 2 para o dobro). Entre 1.0 e 20.0.</FormDescription><FormMessage /></FormItem>)} />
                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={isFormProcessing} className="bg-accent hover:bg-accent/90 text-accent-foreground">{isFormProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CalendarPlus className="mr-2 h-4 w-4" />} {editingEvent ? "Salvar Alterações" : "Salvar Evento"}</Button>
                                        {editingEvent && <Button variant="outline" onClick={() => { setEditingEvent(null); eventForm.reset({ name: "", description: "", imageUrl: "https://placehold.co/400x200.png", startDate: undefined, endDate: undefined, bonusMultiplier: 1, linkedCards: []}); setEventImagePreview("https://placehold.co/400x200.png"); }} disabled={isFormProcessing}>Cancelar Edição</Button>}
                                    </div>
                                </form>
                             </Form>
                             <Separator />
                            <h3 className="text-lg font-semibold">Eventos Criados ({events.length})</h3>
                            <ScrollArea className="h-[400px]">
                                <Table>
                                    <TableHeader><TableRow><TableHead className="w-[100px]">Imagem</TableHead><TableHead>Nome</TableHead><TableHead>Período</TableHead><TableHead className="text-center">Multiplicador</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                                     <TableBody>
                                        {events.map((event) => {
                                            const status = getEventStatus(event);
                                            return (
                                            <TableRow key={event.id}>
                                                <TableCell>
                                                    <NextImage src={event.imageUrl || "https://placehold.co/80x45.png"} alt={event.name} width={80} height={45} className="rounded-sm border object-cover" data-ai-hint="event banner" />
                                                </TableCell>
                                                <TableCell className="font-medium">{event.name}</TableCell>
                                                <TableCell className="text-xs">{(event.startDate).toLocaleDateString('pt-BR')} - {(event.endDate).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell className="text-center font-semibold">{event.bonusMultiplier}x</TableCell>
                                                <TableCell><Badge variant={status === 'Ativo' ? 'default' : status === 'Agendado' ? 'secondary' : 'outline'} className={status === 'Ativo' ? "bg-green-500 text-white" : ""}>{status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingEvent(event)} className="hover:text-primary" disabled={isFormProcessing}><Edit3 className="h-4 w-4"/></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="hover:text-destructive" disabled={isFormProcessing}><Trash2 className="h-4 w-4"/></Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir o evento "{event.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteEvent(event)} className="bg-destructive hover:bg-destructive/90" disabled={isFormProcessing}>Excluir</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                        {events.length === 0 && !isInitialLoading && (
                                            <TableRow><TableCell colSpan={6} className="text-center py-4">Nenhum evento encontrado.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                );
            case 'settings':
                return (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Configurações Gerais</CardTitle>
                            <CardDescription>Ajustes globais do sistema IFCoins.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="enable-trades">Habilitar Trocas entre Alunos</Label>
                                    <p className="text-xs text-muted-foreground">Permitir que alunos proponham e aceitem trocas de cartas e moedas.</p>
                                </div>
                                <Switch id="enable-trades" defaultChecked={true} disabled={isFormProcessing} />
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="pack-limit">Limite Mensal de Pacotes Surpresa</Label>
                                     <p className="text-xs text-muted-foreground">Quantos pacotes "Surpresa Mensal" cada aluno pode comprar por mês.</p>
                                </div>
                                <Input id="pack-limit" type="number" className="w-20" defaultValue={1} disabled={isFormProcessing} />
                            </div>
                             <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                                 <h4 className="font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Zona de Perigo</h4>
                                 <p className="text-sm text-destructive/80 mt-1 mb-3">Ações nesta seção podem ter efeitos significativos.</p>
                                 <Button variant="destructive" size="sm" disabled>Resetar Temporada (Em Breve)</Button>
                                 <p className="text-xs text-muted-foreground mt-1">Esta ação limpará moedas e cartas de todos os alunos.</p>
                             </div>
                             <Button disabled={isFormProcessing}> {isFormProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Salvar Configurações (Em Breve)</Button>
                        </CardContent>
                    </Card>
                );
            default:
                return null;
        }
    };

    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalCoinsInSystem = users.reduce((acc, user) => acc + (user.coins || 0), 0);
    const activeEventsCount = events.filter(e => getEventStatus(e) === 'Ativo').length;


    return (
        <div className="container mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-primary">Painel Administrativo</h1>
            <p className="text-muted-foreground">Bem-vindo, Administrador. Gerencie o sistema IFCoins.</p>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Estudantes Ativos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{isInitialLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : totalStudents}</div><p className="text-xs text-muted-foreground">{users.length} usuários totais</p></CardContent>
                </Card>
                 <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cartas no Sistema</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{isInitialLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : cards.length}</div><p className="text-xs text-muted-foreground">Tipos de cartas únicas</p></CardContent>
                 </Card>
                 <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle><Star className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{isInitialLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : activeEventsCount}</div><p className="text-xs text-muted-foreground">{events.length} eventos totais</p></CardContent>
                 </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Moedas Circulando</CardTitle><Coins className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{isInitialLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : totalCoinsInSystem.toLocaleString('pt-BR')}</div><p className="text-xs text-muted-foreground">Total de IFCoins no sistema</p></CardContent>
                </Card>
            </div>

            <div className="border-b">
                <nav className="-mb-px flex space-x-1 md:space-x-4 overflow-x-auto" aria-label="Tabs">
                    <Button variant={activeTab === 'users' ? 'default' : 'ghost'} onClick={() => setActiveTab('users')} className="whitespace-nowrap py-3 px-2 md:px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary">
                        <Users className="mr-2 h-4 w-4"/>Gerenciar Usuários
                    </Button>
                    <Button variant={activeTab === 'cards' ? 'default' : 'ghost'} onClick={() => setActiveTab('cards')} className="whitespace-nowrap py-3 px-2 md:px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary">
                        <CreditCard className="mr-2 h-4 w-4"/>Gerenciar Cartas
                    </Button>
                    <Button variant={activeTab === 'events' ? 'default' : 'ghost'} onClick={() => setActiveTab('events')} className="whitespace-nowrap py-3 px-2 md:px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary">
                       <CalendarPlus className="mr-2 h-4 w-4"/>Gerenciar Eventos
                    </Button>
                    <Button variant={activeTab === 'settings' ? 'default' : 'ghost'} onClick={() => setActiveTab('settings')} className="whitespace-nowrap py-3 px-2 md:px-1 border-b-2 font-medium text-sm data-[state=active]:border-primary data-[state=active]:text-primary">
                        <Settings className="mr-2 h-4 w-4"/>Configurações
                    </Button>
                     <Button variant={'ghost'} onClick={() => toast({title: "Em Desenvolvimento", description: "Página de relatórios estará disponível em breve."})} className="whitespace-nowrap py-3 px-2 md:px-1 border-b-2 font-medium text-sm" >
                        <BarChart3 className="mr-2 h-4 w-4"/>Relatórios
                    </Button>
                </nav>
            </div>

            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
}
