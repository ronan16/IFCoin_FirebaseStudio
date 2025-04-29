// src/components/dashboards/AdminDashboard.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, CreditCard, CalendarPlus, Settings, BarChart3, Upload, Star, Users, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker'; // Assuming DatePicker component exists

// Mock Data - Replace with actual data fetching
const registeredUsers = [
    { id: "uid1", name: "João Aluno Silva", ra: "2023001", email: "joao.aluno@ifpr.edu.br", role: "student", status: "Ativo" },
    { id: "uidT1", name: "Prof. Carlos Mestre", email: "carlos.mestre@ifpr.edu.br", role: "teacher", status: "Ativo" },
    { id: "uidA1", name: "Admin Sistema", email: "admin@ifpr.edu.br", role: "admin", status: "Ativo" },
    { id: "uid2", name: "Maria Estudante Souza", ra: "2023002", email: "maria.estudante@ifpr.edu.br", role: "student", status: "Pendente" },
];

const cards = [
    { id: "card001", name: "Energia Solar IF", rarity: "Comum", available: true, quantity: null, event: null },
    { id: "card002", name: "Espírito Tecnológico", rarity: "Lendário", available: true, quantity: 20, event: "Semana Tec" },
    { id: "card003", name: "Mascote IF Verde", rarity: "Raro", available: false, quantity: 0, event: null },
];

const events = [
    { id: "event01", name: "Semana da Tecnologia", startDate: "2024-10-15", endDate: "2024-10-20", multiplier: 2, status: "Ativo" },
    { id: "event02", name: "Feira de Ciências", startDate: "2024-11-01", endDate: "2024-11-05", multiplier: 1.5, status: "Agendado" },
    { id: "event03", name: "Gincana Cultural", startDate: "2024-09-01", endDate: "2024-09-07", multiplier: 1, status: "Concluído" },
];

const studentSchema = z.object({
    // Assuming bulk registration via CSV or similar for MVP might be simpler
    // Or individual registration form:
    name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
    ra: z.string().regex(/^\d+$/, { message: "RA deve conter apenas números." }),
    email: z.string().email({ message: "Email inválido." }),
    // class: z.string().min(1, { message: "Turma é obrigatória."}), // Optional
});

const cardSchema = z.object({
    name: z.string().min(3, "Nome da carta é muito curto."),
    rarity: z.enum(["Comum", "Raro", "Lendário", "Mítico"]),
    imageUrl: z.string().url("URL da imagem inválida."),
    available: z.boolean().default(true),
    copiesAvailable: z.coerce.number().optional().nullable(),
    eventId: z.string().optional().nullable(),
});

const eventSchema = z.object({
    name: z.string().min(3, "Nome do evento é muito curto."),
    startDate: z.date({ required_error: "Data de início é obrigatória." }),
    endDate: z.date({ required_error: "Data de término é obrigatória." }),
    bonusMultiplier: z.coerce.number().min(1).max(5).default(1), // Example range
    linkedCards: z.array(z.string()).optional(), // Array of card IDs
}).refine((data) => data.endDate >= data.startDate, {
    message: "Data de término deve ser igual ou posterior à data de início.",
    path: ["endDate"],
});


export function AdminDashboard() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('users'); // users, cards, events, settings

    // Forms for different sections (example for cards)
    const cardForm = useForm<z.infer<typeof cardSchema>>({
        resolver: zodResolver(cardSchema),
        defaultValues: {
            name: "",
            rarity: "Comum",
            imageUrl: "",
            available: true,
            copiesAvailable: null,
            eventId: null,
        },
    });

    const eventForm = useForm<z.infer<typeof eventSchema>>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            name: "",
            startDate: undefined,
            endDate: undefined,
            bonusMultiplier: 1,
            linkedCards: [],
        },
    });


    async function onCardSubmit(values: z.infer<typeof cardSchema>) {
        console.log("Card Submitted:", values);
        // TODO: Implement API call to register card
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "Carta Registrada!", description: `A carta "${values.name}" foi adicionada.` });
        cardForm.reset();
    }

     async function onEventSubmit(values: z.infer<typeof eventSchema>) {
        console.log("Event Submitted:", values);
        // TODO: Implement API call to create/update event
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "Evento Criado/Atualizado!", description: `O evento "${values.name}" foi salvo.` });
        eventForm.reset();
    }

     async function handleStudentRegistration(data: any /* Consider using a specific type or schema */) {
        console.log("Registering students:", data);
        // TODO: Implement bulk student registration logic (e.g., parse CSV, call API)
         await new Promise(resolve => setTimeout(resolve, 1500));
         toast({ title: "Alunos Pré-Registrados!", description: "Emails de configuração de senha foram enviados." });
     }


    const renderContent = () => {
        switch (activeTab) {
            case 'users':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Gerenciar Usuários</CardTitle>
                            <CardDescription>Pré-registrar alunos e visualizar usuários.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <Label htmlFor="student-upload" className="text-sm font-medium">Pré-Registro em Massa (CSV)</Label>
                                <div className="flex items-center gap-2 mt-1">
                                     <Input id="student-upload" type="file" accept=".csv" className="flex-1"/>
                                     <Button size="sm" onClick={() => handleStudentRegistration({})}> {/* Pass file data */}
                                        <Upload className="mr-2 h-4 w-4" /> Enviar Arquivo
                                     </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Formato esperado: RA, Email, Nome Completo, Turma (Opcional)</p>
                            </div>
                            <Separator />
                             <h3 className="text-lg font-semibold">Usuários Registrados</h3>
                             <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Função</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {registeredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name} {user.ra ? `(${user.ra})` : ''}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell><Badge variant="secondary" className="capitalize">{user.role}</Badge></TableCell>
                                                <TableCell><Badge variant={user.status === 'Ativo' ? 'default' : 'outline'} className={user.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{user.status}</Badge></TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm">Editar</Button> {/* Add functionality */}
                                                </TableCell>
                                            </TableRow>
                                        ))}
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
                            <CardDescription>Adicionar novas cartas e gerenciar existentes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <Form {...cardForm}>
                                <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-4 p-4 border rounded-lg">
                                     <h3 className="text-lg font-semibold mb-2">Adicionar Nova Carta</h3>
                                    <FormField control={cardForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Carta</FormLabel><FormControl><Input placeholder="Ex: Mascote IFPR Raro" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                     <FormField control={cardForm.control} name="rarity" render={({ field }) => (<FormItem><FormLabel>Raridade</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a raridade" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Comum">Comum</SelectItem><SelectItem value="Raro">Raro</SelectItem><SelectItem value="Lendário">Lendário</SelectItem><SelectItem value="Mítico">Mítico</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={cardForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input type="url" placeholder="https://exemplo.com/imagem.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={cardForm.control} name="copiesAvailable" render={({ field }) => (<FormItem><FormLabel>Cópias Disponíveis (Opcional)</FormLabel><FormControl><Input type="number" placeholder="Deixe em branco para ilimitado" {...field} value={field.value ?? ''} /></FormControl><FormDescription className="text-xs">Para cartas limitadas.</FormDescription><FormMessage /></FormItem>)} />
                                    {/* TODO: Add Event ID selector */}
                                    <FormField control={cardForm.control} name="available" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Disponível na Loja?</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                    <Button type="submit" className="bg-accent hover:bg-accent/90"> Adicionar Carta</Button>
                                </form>
                            </Form>
                             <Separator />
                            <h3 className="text-lg font-semibold">Cartas Registradas</h3>
                             <ScrollArea className="h-[300px]">
                                <Table>
                                     <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Raridade</TableHead><TableHead>Disponível</TableHead><TableHead>Quantidade</TableHead><TableHead>Evento</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {cards.map((card) => (
                                            <TableRow key={card.id}>
                                                <TableCell className="font-medium">{card.name}</TableCell>
                                                <TableCell><Badge variant={
                                                     card.rarity === 'Mítico' ? 'destructive' : card.rarity === 'Lendário' ? 'default' : card.rarity === 'Raro' ? 'secondary' : 'outline'
                                                }>{card.rarity}</Badge></TableCell>
                                                <TableCell>{card.available ? 'Sim' : 'Não'}</TableCell>
                                                <TableCell>{card.quantity ?? 'Ilimitado'}</TableCell>
                                                <TableCell>{card.event ?? '-'}</TableCell>
                                                <TableCell><Button variant="ghost" size="sm">Editar</Button></TableCell>
                                            </TableRow>
                                        ))}
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
                            <CardDescription>Criar eventos com multiplicadores de bônus e cartas especiais.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <Form {...eventForm}>
                                <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-4 p-4 border rounded-lg">
                                     <h3 className="text-lg font-semibold mb-2">Criar/Editar Evento</h3>
                                     <FormField control={eventForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Evento</FormLabel><FormControl><Input placeholder="Ex: Semana da Cultura Nerd" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={eventForm.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><DatePicker date={field.value} setDate={field.onChange} /><FormMessage /></FormItem>)} />
                                         <FormField control={eventForm.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Término</FormLabel><DatePicker date={field.value} setDate={field.onChange} /><FormMessage /></FormItem>)} />
                                    </div>
                                     <FormField control={eventForm.control} name="bonusMultiplier" render={({ field }) => (<FormItem><FormLabel>Multiplicador de Bônus</FormLabel><FormControl><Input type="number" min="1" step="0.1" placeholder="Ex: 1.5 ou 2" {...field} /></FormControl><FormDescription className="text-xs">Quantas vezes mais moedas serão ganhas durante o evento.</FormDescription><FormMessage /></FormItem>)} />
                                    {/* TODO: Add multi-select for linked cards */}
                                    <Button type="submit" className="bg-accent hover:bg-accent/90"> Salvar Evento</Button>
                                </form>
                             </Form>
                             <Separator />
                            <h3 className="text-lg font-semibold">Eventos Criados</h3>
                            <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Período</TableHead><TableHead className="text-center">Multiplicador</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                                     <TableBody>
                                        {events.map((event) => (
                                            <TableRow key={event.id}>
                                                <TableCell className="font-medium">{event.name}</TableCell>
                                                <TableCell className="text-xs">{new Date(event.startDate).toLocaleDateString('pt-BR')} - {new Date(event.endDate).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell className="text-center font-semibold">{event.multiplier}x</TableCell>
                                                <TableCell><Badge variant={event.status === 'Ativo' ? 'default' : event.status === 'Agendado' ? 'secondary' : 'outline'}>{event.status}</Badge></TableCell>
                                                <TableCell><Button variant="ghost" size="sm">Editar</Button></TableCell>
                                            </TableRow>
                                        ))}
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
                                    <Label>Habilitar Trocas entre Alunos</Label>
                                    <Description className="text-xs text-muted-foreground">Permitir que alunos proponham e aceitem trocas.</Description>
                                </div>
                                <Switch /> {/* Add state management */}
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label>Limite Mensal de Pacotes</Label>
                                     <Description className="text-xs text-muted-foreground">Quantos pacotes cada aluno pode comprar por mês.</Description>
                                </div>
                                <Input type="number" className="w-20" defaultValue={1} /> {/* Add state management */}
                            </div>
                             <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                                 <h4 className="font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Zona de Perigo</h4>
                                 <p className="text-sm text-destructive/80 mt-1 mb-2">Ações nesta seção podem ter efeitos irreversíveis.</p>
                                 <Button variant="destructive" size="sm">Resetar Temporada (Limpar Moedas/Cartas)</Button> {/* Add confirmation dialog */}
                             </div>
                        </CardContent>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-primary">Painel Administrativo</h1>

            {/* Quick Stats/Overview */}
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Usuários Totais</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{registeredUsers.length}</div></CardContent>
                </Card>
                 <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cartas Registradas</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{cards.length}</div></CardContent>
                 </Card>
                 <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle><Star className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{events.filter(e => e.status === 'Ativo').length}</div></CardContent>
                 </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Relatórios</CardTitle><BarChart3 className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><Button variant="link" size="sm" className="p-0 h-auto">Ver Estatísticas</Button></CardContent>
                </Card>
            </div>

            {/* Tabs for Navigation */}
            <div className="flex border-b">
                <Button variant={activeTab === 'users' ? "default" : "ghost"} onClick={() => setActiveTab('users')} className="rounded-none rounded-tl-md border-b-2 border-transparent data-[state=active]:border-primary">Usuários</Button>
                <Button variant={activeTab === 'cards' ? "default" : "ghost"} onClick={() => setActiveTab('cards')} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">Cartas</Button>
                <Button variant={activeTab === 'events' ? "default" : "ghost"} onClick={() => setActiveTab('events')} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">Eventos</Button>
                <Button variant={activeTab === 'settings' ? "default" : "ghost"} onClick={() => setActiveTab('settings')} className="rounded-none rounded-tr-md border-b-2 border-transparent data-[state=active]:border-primary">Configurações</Button>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
}

// Helper component (example) - real app might import Label and Description from ui/form
const Label = ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>{children}</label>;
const Description = ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p className="text-[0.8rem] text-muted-foreground" {...props}>{children}</p>;

// Basic DatePicker Placeholder - Replace with actual implementation
function DatePicker({ date, setDate }: { date?: Date, setDate: (date?: Date) => void }) {
    return (
        <Input
            type="date"
            value={date ? date.toISOString().split('T')[0] : ''}
            onChange={(e) => setDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)} // Ensure time is handled correctly
            className="w-full"
        />
    );
}

