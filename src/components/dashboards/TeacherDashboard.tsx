// src/components/dashboards/TeacherDashboard.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Gift, History, Users, Clock, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock Data - Replace with actual data fetching
const students = [
    { id: "uid1", name: "João Aluno Silva", ra: "2023001", class: "2A INFO" },
    { id: "uid2", name: "Maria Estudante Souza", ra: "2023002", class: "2B AGRO" },
    { id: "uid3", name: "Pedro Colega Oliveira", ra: "2023003", class: "2A INFO" },
    { id: "uid4", name: "Ana Amiga Pereira", ra: "2023004", class: "3A INFO" },
];

const classes = ["2A INFO", "2B AGRO", "3A INFO", "TODAS AS TURMAS"];

const rewardHistory = [
    { id: "rew1", studentName: "João Aluno Silva", coins: 5, reason: "Ajudou a limpar o laboratório", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: "Concluído" },
    { id: "rew2", studentName: "Maria Estudante Souza", coins: 10, reason: "Excelente participação na aula", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), status: "Concluído" },
    { id: "rew3", studentName: "Turma 2A INFO", coins: 3, reason: "Entrega de trabalho em grupo", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: "Concluído" },
];

const rewardFormSchema = z.object({
  targetType: z.enum(['student', 'class']),
  targetId: z.string().min(1, { message: "Selecione um aluno ou turma." }),
  coins: z.coerce.number().min(1, { message: "A quantidade mínima é 1." }).max(10, { message: "A quantidade máxima por hora é 10." }),
  reason: z.string().min(5, { message: "A justificativa deve ter pelo menos 5 caracteres." }).max(100, { message: "Máximo de 100 caracteres." }),
});

export function TeacherDashboard() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const form = useForm<z.infer<typeof rewardFormSchema>>({
        resolver: zodResolver(rewardFormSchema),
        defaultValues: {
            targetType: 'student',
            targetId: '',
            coins: 1,
            reason: '',
        },
    });

    const targetType = form.watch('targetType');

    async function onSubmit(values: z.infer<typeof rewardFormSchema>) {
        console.log("Reward Submitted:", values);
        // TODO: Implement API call to reward student/class
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: "Recompensa Enviada!",
            description: `${values.coins} IFCoins foram dados com sucesso.`,
            variant: "default",
        });
        form.reset(); // Reset form after successful submission
    }

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.ra.includes(searchTerm)
    );

    return (
        <div className="container mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-primary">Painel do Professor/Servidor</h1>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Reward Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-accent" /> Recompensar Alunos
                        </CardTitle>
                        <CardDescription>Distribua IFCoins por bom comportamento ou desempenho.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="targetType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Alvo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione Aluno ou Turma" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="student">Aluno Individual</SelectItem>
                                                    <SelectItem value="class">Turma Inteira</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {targetType === 'student' && (
                                    <FormField
                                        control={form.control}
                                        name="targetId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Aluno</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                     <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione um aluno" />
                                                        </SelectTrigger>
                                                     </FormControl>
                                                     <SelectContent>
                                                        {/* Consider adding a search input here for long lists */}
                                                        {students.map(student => (
                                                            <SelectItem key={student.id} value={student.id}>
                                                                {student.name} ({student.ra}) - {student.class}
                                                            </SelectItem>
                                                        ))}
                                                     </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {targetType === 'class' && (
                                     <FormField
                                        control={form.control}
                                        name="targetId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Turma</FormLabel>
                                                 <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione uma turma" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                     <SelectContent>
                                                        {classes.map(className => (
                                                            <SelectItem key={className} value={className}>
                                                                {className}
                                                            </SelectItem>
                                                        ))}
                                                     </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="coins"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantidade de IFCoins</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" max="10" placeholder="1-10" {...field} />
                                            </FormControl>
                                             <FormDescription className="text-xs flex items-center gap-1">
                                                 <Clock className="h-3 w-3" /> Limite de 10 moedas por hora por aluno.
                                             </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="reason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Justificativa</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Descreva o motivo da recompensa (ex: participação exemplar, ajuda a colegas)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                                    <Gift className="mr-2 h-4 w-4" /> Enviar Recompensa
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Reward History Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <History className="h-5 w-5" /> Histórico de Recompensas
                        </CardTitle>
                        <CardDescription>Veja as últimas recompensas que você distribuiu.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-[300px]"> {/* Adjust height as needed */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aluno/Turma</TableHead>
                                        <TableHead className="text-right">Moedas</TableHead>
                                        <TableHead>Data</TableHead>
                                        {/* <TableHead>Status</TableHead> */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rewardHistory.map((reward) => (
                                        <TableRow key={reward.id}>
                                            <TableCell className="font-medium">{reward.studentName}</TableCell>
                                            <TableCell className="text-right text-yellow-600 font-semibold">{reward.coins}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{reward.timestamp.toLocaleString('pt-BR')}</TableCell>
                                            {/* <TableCell><Badge variant={reward.status === 'Concluído' ? 'default' : 'secondary'}>{reward.status}</Badge></TableCell> */}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </ScrollArea>
                    </CardContent>
                     <CardFooter>
                        {/* Optional: Add pagination or "view all" button if history is long */}
                     </CardFooter>
                </Card>
            </div>

             {/* Student List / Search */}
             <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" /> Lista de Alunos
                    </CardTitle>
                    <CardDescription>Consulte informações básicas dos alunos.</CardDescription>
                     <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nome ou RA..."
                            className="pl-8 w-full md:w-1/2 lg:w-1/3"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                     <ScrollArea className="h-[300px]"> {/* Adjust height as needed */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>RA</TableHead>
                                    <TableHead>Turma</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.ra}</TableCell>
                                            <TableCell>{student.class}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            Nenhum aluno encontrado.
                                        </TableCell>
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
