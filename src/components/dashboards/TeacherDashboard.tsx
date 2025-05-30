
// src/components/dashboards/TeacherDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift, History, Users, Clock, Search, Loader2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import { auth, db, serverTimestamp } from '@/lib/firebase/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, runTransaction, writeBatch, orderBy, Timestamp, onSnapshot, getDoc } from 'firebase/firestore'; // Added getDoc
import { Separator } from '../ui/separator';
import { Badge } from "@/components/ui/badge"; // Added Badge import

interface StudentData {
    id: string;
    name: string;
    ra?: string;
    email: string;
    course?: string;
    turma?: string;
    coins?: number;
}

interface TeacherProfile {
    uid: string;
    name: string;
}

interface RewardLog {
    id: string;
    studentName: string;
    studentId: string;
    turma?: string;
    coinsGiven: number;
    reason: string;
    customReason?: string;
    timestamp: Timestamp;
    teacherName: string;
    teacherId: string; // Added to fulfill query requirement for history
}

const coursesList = ["Informática", "Eletrotécnica", "Agroecologia", "Agropecuária", "Sistemas de Informação", "Eng. Agronômica", "Física", "Todos"];
const turmasList = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "TEC1", "TEC2", "Todas"];


const rewardReasons = ["Atividades de aula", "Participação em Evento", "Auxílio com atividades", "Bom comportamento", "Outro"];

const rewardFormSchema = z.object({
  targetType: z.enum(['student', 'turma', 'multiple']).default('student'),
  studentId: z.string().optional(),
  turma: z.string().optional(),
  coins: z.coerce.number().min(10, { message: "Mínimo de 10 moedas." }).max(100, { message: "Máximo de 100 moedas por vez." }),
  reason: z.string().min(1, {message: "Selecione um motivo."}),
  customReason: z.string().optional(),
}).refine(data => {
    if (data.reason === "Outro") {
        return !!data.customReason && data.customReason.length >= 5;
    }
    return true;
}, {
    message: "Descreva o motivo (mínimo 5 caracteres).",
    path: ["customReason"],
});

const ONE_HOUR_MS = 60 * 60 * 1000;

export function TeacherDashboard() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true); // General loading for the page
    const [studentsLoaded, setStudentsLoaded] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [isSubmittingReward, setIsSubmittingReward] = useState(false);
    
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
    const [allStudents, setAllStudents] = useState<StudentData[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    
    const [rewardHistory, setRewardHistory] = useState<RewardLog[]>([]);
    const [lastRewardTimestamps, setLastRewardTimestamps] = useState<Map<string, number>>(new Map());

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCourse, setFilterCourse] = useState('Todos');
    const [filterTurma, setFilterTurma] = useState('Todas');

    const form = useForm<z.infer<typeof rewardFormSchema>>({
        resolver: zodResolver(rewardFormSchema),
        defaultValues: {
            targetType: 'student',
            coins: 10,
            reason: '',
            customReason: '',
        },
    });
    const targetType = form.watch('targetType');
    const reasonType = form.watch('reason');

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const teacherDocRef = doc(db, "users", user.uid);
                getDoc(teacherDocRef).then(docSnap => { 
                    if (docSnap.exists()) {
                        setTeacherProfile({ uid: user.uid, name: docSnap.data().name || user.email || "Professor" });
                    } else {
                        setTeacherProfile({ uid: user.uid, name: user.displayName || user.email || "Professor" });
                    }
                }).catch(error => {
                    console.error("Error fetching teacher's name:", error);
                    setTeacherProfile({ uid: user.uid, name: user.displayName || user.email || "Professor" });
                });
            } else {
                setTeacherProfile(null);
                setStudentsLoaded(true); 
                setHistoryLoaded(true);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Fetch students
    useEffect(() => {
        if (!teacherProfile) {
            setAllStudents([]);
            setFilteredStudents([]);
            setStudentsLoaded(true);
            return;
        }
        setStudentsLoaded(false);
        const fetchStudents = async () => {
            try {
                const q = query(collection(db, "users"), where("role", "==", "student"));
                const querySnapshot = await getDocs(q);
                const studentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentData));
                console.log("[TeacherDashboard] Fetched studentsData from Firestore:", studentsData);
                setAllStudents(studentsData);
                setFilteredStudents(studentsData); 
            } catch (error) {
                console.error("Error fetching students:", error);
                toast({ title: "Erro ao buscar alunos", description: (error as Error).message, variant: "destructive" });
            } finally {
                setStudentsLoaded(true);
            }
        };
        fetchStudents();
    }, [teacherProfile, toast]);
    
    // Fetch reward history for the current teacher
    useEffect(() => {
        if (!teacherProfile) {
            setRewardHistory([]); 
            setHistoryLoaded(true); 
            return;
        }
        setHistoryLoaded(false);
        const q = query(collection(db, "rewards_log"), where("teacherId", "==", teacherProfile.uid), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(docSnap => ({id: docSnap.id, ...docSnap.data()} as RewardLog));
            setRewardHistory(history);
            setHistoryLoaded(true);
        }, (error) => {
            console.error("Error fetching reward history:", error);
            toast({ title: "Erro ao buscar histórico", description: error.message, variant: "destructive"});
            setHistoryLoaded(true);
        });
        return () => unsubscribe();
    }, [teacherProfile, toast]);

    // Update overall loading state
    useEffect(() => {
        if (studentsLoaded && historyLoaded && teacherProfile !== null) { 
            setIsLoading(false);
        } else if (teacherProfile === null && !auth.currentUser) { 
             setIsLoading(false);
        } else {
            setIsLoading(true);
        }
    }, [studentsLoaded, historyLoaded, teacherProfile]);


    // Apply filters
    useEffect(() => {
        let studentsResult = allStudents;
        console.log("[TeacherDashboard] Applying filters. All students before filtering:", allStudents);
        if (searchTerm) {
            studentsResult = studentsResult.filter(s => 
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (s.ra && s.ra.includes(searchTerm))
            );
        }
        if (filterCourse !== 'Todos') {
            studentsResult = studentsResult.filter(s => s.course === filterCourse);
        }
        if (filterTurma !== 'Todas') {
            studentsResult = studentsResult.filter(s => s.turma === filterTurma);
        }
        console.log("[TeacherDashboard] Filtered students result:", studentsResult);
        setFilteredStudents(studentsResult);
    }, [searchTerm, filterCourse, filterTurma, allStudents]);


    const handleSelectStudent = (studentId: string) => {
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
        // Logic to switch targetType based on selection
        if (selectedStudentIds.size > 0 && targetType !== 'multiple') {
             // This check needs to be against the newSet.size after potential modification
             const tempSet = new Set(selectedStudentIds);
             if (tempSet.has(studentId)) tempSet.delete(studentId); else tempSet.add(studentId);

             if (tempSet.size > 0) form.setValue('targetType', 'multiple');
             else form.setValue('targetType', 'student');

        } else if (selectedStudentIds.size === 1 && selectedStudentIds.has(studentId) && targetType === 'multiple') { // If unselecting the last one
            form.setValue('targetType', 'student');
        }
    };

    const handleSelectAllFiltered = (checked: boolean) => {
        if (checked) {
            const newSelectedIds = new Set(filteredStudents.map(s => s.id));
            setSelectedStudentIds(newSelectedIds);
            if (newSelectedIds.size > 0 && targetType !== 'multiple') form.setValue('targetType', 'multiple');
        } else {
            setSelectedStudentIds(new Set());
            if (targetType === 'multiple') form.setValue('targetType', 'student');
        }
    };
    
    const canRewardStudent = (studentId: string, amount: number): boolean => {
        if (amount < 10 || amount > 100) return false; 
        const lastRewardTime = lastRewardTimestamps.get(studentId);
        if (lastRewardTime && (Date.now() - lastRewardTime) < ONE_HOUR_MS) {
            return false;
        }
        return true;
    };


    async function onSubmit(values: z.infer<typeof rewardFormSchema>) {
        if (!teacherProfile) {
            toast({ title: "Erro", description: "Professor não identificado.", variant: "destructive" });
            return;
        }
        setIsSubmittingReward(true);

        let studentsToReward: StudentData[] = [];

        if (values.targetType === 'student' && values.studentId) {
            const student = allStudents.find(s => s.id === values.studentId);
            if (student) studentsToReward.push(student);
        } else if (values.targetType === 'turma' && values.turma && values.turma !== 'Todas') {
            studentsToReward = allStudents.filter(s => s.turma === values.turma);
        } else if (values.targetType === 'multiple' && selectedStudentIds.size > 0) {
            studentsToReward = allStudents.filter(s => selectedStudentIds.has(s.id));
        }

        if (studentsToReward.length === 0) {
            toast({ title: "Nenhum Aluno Selecionado", description: "Por favor, selecione ao menos um aluno ou turma para recompensar.", variant: "destructive" });
            setIsSubmittingReward(false);
            return;
        }
        
        const now = Date.now();
        const newTimestamps = new Map(lastRewardTimestamps);
        let actuallyRewardedCount = 0;
        let skippedDueToLimit = 0;

        try {
            const batch = writeBatch(db);

            for (const student of studentsToReward) {
                if (!canRewardStudent(student.id, values.coins)) {
                     console.warn(`Limite horário para ${student.name}. Recompensa pulada.`);
                     skippedDueToLimit++;
                     continue; 
                }

                const studentRef = doc(db, "users", student.id);
                const studentDocSnapshot = await getDoc(studentRef); // Get current student data
                if (!studentDocSnapshot.exists()) {
                    console.warn(`Aluno ${student.name} (ID: ${student.id}) não encontrado para recompensa.`);
                    continue;
                }
                const currentCoins = studentDocSnapshot.data()?.coins || 0;
                batch.update(studentRef, { coins: currentCoins + values.coins });

                const rewardLogRef = doc(collection(db, "rewards_log"));
                batch.set(rewardLogRef, {
                    teacherId: teacherProfile.uid,
                    teacherName: teacherProfile.name,
                    studentId: student.id,
                    studentName: student.name,
                    turma: student.turma || null,
                    coinsGiven: values.coins,
                    reason: values.reason,
                    customReason: values.reason === "Outro" ? values.customReason : null,
                    timestamp: serverTimestamp(),
                });
                newTimestamps.set(student.id, now);
                actuallyRewardedCount++;
            }
            
            if (actuallyRewardedCount > 0) {
                await batch.commit();
                setLastRewardTimestamps(newTimestamps);
                toast({
                    title: "Recompensa Enviada!",
                    description: `${values.coins} IFCoins foram dados a ${actuallyRewardedCount} aluno(s). ${skippedDueToLimit > 0 ? `${skippedDueToLimit} aluno(s) foram pulados devido ao limite horário.` : ''}`,
                });
                form.reset({ targetType: 'student', studentId: undefined, turma: undefined, coins: 10, reason: '', customReason: '' });
                setSelectedStudentIds(new Set());
            } else if (skippedDueToLimit > 0 && studentsToReward.length === skippedDueToLimit) {
                 toast({ title: "Nenhuma Recompensa Enviada", description: `Todos os ${skippedDueToLimit} aluno(s) selecionados já foram recompensados recentemente.`, variant: "default" });
            } else {
                 toast({ title: "Nenhuma Recompensa Enviada", description: "Verifique os alunos selecionados e o limite horário.", variant: "default" });
            }

        } catch (error) {
            console.error("Error submitting reward:", error);
            toast({ title: "Erro ao Enviar Recompensa", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsSubmittingReward(false);
        }
    }
    
    const uniqueTurmasInSystem = ["Todas", ...new Set(allStudents.map(s => s.turma).filter(Boolean) as string[])].sort((a,b) => a === "Todas" ? -1 : b === "Todas" ? 1 : a.localeCompare(b));
    const uniqueCoursesInSystem = ["Todos", ...new Set(allStudents.map(s => s.course).filter(Boolean) as string[])].sort((a,b) => a === "Todos" ? -1 : b === "Todas" ? 1 : a.localeCompare(b));


    if (isLoading) { 
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Carregando...</div>;
    }

    return (
        <div className="container mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-primary">Painel do Professor</h1>
            <p className="text-muted-foreground">Bem-vindo, {teacherProfile?.name}. Recompense seus alunos e acompanhe o progresso.</p>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-accent" /> Recompensar Alunos</CardTitle>
                        <CardDescription>Distribua IFCoins por mérito.</CardDescription>
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
                                            <Select 
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    if (value !== 'multiple') setSelectedStudentIds(new Set());
                                                    form.setValue('studentId', undefined); 
                                                    form.setValue('turma', undefined);
                                                }} 
                                                value={field.value}
                                            >
                                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione Aluno ou Turma" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="student">Aluno Individual</SelectItem>
                                                    <SelectItem value="turma">Turma Inteira</SelectItem>
                                                    <SelectItem value="multiple" disabled={selectedStudentIds.size === 0}>Múltiplos Alunos ({selectedStudentIds.size})</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {targetType === 'student' && (
                                    <FormField control={form.control} name="studentId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Aluno</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                     <FormControl><SelectTrigger><SelectValue placeholder="Selecione um aluno" /></SelectTrigger></FormControl>
                                                     <SelectContent><ScrollArea className="h-[200px]">
                                                        {allStudents.sort((a,b) => a.name.localeCompare(b.name)).map(student => (
                                                            <SelectItem key={student.id} value={student.id} disabled={!canRewardStudent(student.id, form.getValues('coins')) && !!lastRewardTimestamps.get(student.id)}>
                                                                {student.name} ({student.ra}) - {student.turma}
                                                                {!canRewardStudent(student.id, form.getValues('coins')) && !!lastRewardTimestamps.get(student.id) && <span className="text-xs text-destructive ml-1">(Limite)</span>}
                                                            </SelectItem>
                                                        ))}
                                                     </ScrollArea></SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {targetType === 'turma' && (
                                     <FormField control={form.control} name="turma"
                                        render={({ field }) => (
                                            <FormItem> <FormLabel>Turma</FormLabel>
                                                 <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma turma" /></SelectTrigger></FormControl>
                                                     <SelectContent>
                                                        {uniqueTurmasInSystem.filter(t => t !== 'Todas').map(turmaName => (
                                                            <SelectItem key={turmaName} value={turmaName}>{turmaName}</SelectItem>
                                                        ))}
                                                     </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                {targetType === 'multiple' && (
                                    <div className="p-2 border rounded-md bg-secondary/50">
                                        <p className="text-sm font-medium">{selectedStudentIds.size} aluno(s) selecionado(s) da lista.</p>
                                        <p className="text-xs text-muted-foreground">Use a tabela abaixo para selecionar/desselecionar.</p>
                                    </div>
                                )}

                                <FormField control={form.control} name="coins"
                                    render={({ field }) => (
                                        <FormItem><FormLabel>Quantidade de IFCoins (10-100)</FormLabel>
                                            <FormControl><Input type="number" min="10" max="100" placeholder="10-100" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="reason"
                                    render={({ field }) => (
                                        <FormItem><FormLabel>Motivo</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {rewardReasons.map(reason => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {reasonType === "Outro" && (
                                    <FormField control={form.control} name="customReason"
                                        render={({ field }) => (
                                            <FormItem><FormLabel>Descreva o Motivo</FormLabel>
                                                <FormControl><Textarea placeholder="Motivo detalhado..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmittingReward || (targetType === 'multiple' && selectedStudentIds.size === 0) || (targetType === 'student' && !form.getValues('studentId')) || (targetType === 'turma' && (!form.getValues('turma') || form.getValues('turma') === 'Todas'))}>
                                    {isSubmittingReward ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Gift className="mr-2 h-4 w-4" />} Enviar Recompensa
                                </Button>
                                <FormDescription className="text-xs flex items-center gap-1">
                                     <Clock className="h-3 w-3" /> Limite (aproximado) de recompensa por aluno a cada hora.
                                 </FormDescription>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Lista de Alunos</CardTitle>
                        <CardDescription>Consulte e selecione alunos para recompensar.</CardDescription>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                            <Input placeholder="Buscar por Nome/RA..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="md:col-span-1" />
                            <Select value={filterCourse} onValueChange={setFilterCourse}>
                                <SelectTrigger><Filter className="h-3 w-3 mr-1" /> <SelectValue placeholder="Filtrar por Curso" /></SelectTrigger>
                                <SelectContent>{uniqueCoursesInSystem.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={filterTurma} onValueChange={setFilterTurma}>
                                <SelectTrigger><Filter className="h-3 w-3 mr-1" /> <SelectValue placeholder="Filtrar por Turma" /></SelectTrigger>
                                <SelectContent>{uniqueTurmasInSystem.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox 
                                                checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length && filteredStudents.every(s => selectedStudentIds.has(s.id))}
                                                onCheckedChange={(checked) => handleSelectAllFiltered(Boolean(checked))}
                                                aria-label="Selecionar todos os filtrados"
                                                disabled={filteredStudents.length === 0}
                                            />
                                        </TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>RA</TableHead>
                                        <TableHead>Curso</TableHead>
                                        <TableHead>Turma</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentsLoaded && filteredStudents.length === 0 && !allStudents.length && <tr><TableCell colSpan={6} className="text-center text-muted-foreground py-4">Nenhum aluno cadastrado no sistema.</TableCell></tr>}
                                    {studentsLoaded && filteredStudents.length === 0 && allStudents.length > 0 && <tr><TableCell colSpan={6} className="text-center text-muted-foreground py-4">Nenhum aluno encontrado com os filtros atuais.</TableCell></tr>}
                                    {filteredStudents.map((student) => (
                                        <TableRow key={student.id} data-state={selectedStudentIds.has(student.id) ? "selected" : ""}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedStudentIds.has(student.id)}
                                                    onCheckedChange={() => handleSelectStudent(student.id)}
                                                    aria-label={`Selecionar ${student.name}`}
                                                    disabled={!canRewardStudent(student.id, form.getValues('coins')) && !!lastRewardTimestamps.get(student.id) && targetType !== 'student'}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.ra}</TableCell>
                                            <TableCell>{student.course}</TableCell>
                                            <TableCell>{student.turma}</TableCell>
                                            <TableCell>
                                                {!canRewardStudent(student.id, form.getValues('coins')) && !!lastRewardTimestamps.get(student.id) && (
                                                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Limite</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            
            <Separator className="my-6" />

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Histórico de Recompensas</CardTitle>
                    <CardDescription>Suas últimas recompensas distribuídas.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ScrollArea className="h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Aluno/Turma</TableHead>
                                    <TableHead className="text-right">Moedas</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historyLoaded && rewardHistory.length === 0 && <tr><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhuma recompensa enviada ainda.</TableCell></tr>}
                                {rewardHistory.map((reward) => (
                                    <TableRow key={reward.id}>
                                        <TableCell className="font-medium">{reward.studentName} {reward.turma && `(Turma: ${reward.turma})`}</TableCell>
                                        <TableCell className="text-right text-yellow-600 font-semibold">{reward.coinsGiven}</TableCell>
                                        <TableCell>{reward.reason === "Outro" ? reward.customReason : reward.reason}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {reward.timestamp && typeof reward.timestamp.toDate === 'function' 
                                                ? reward.timestamp.toDate().toLocaleString('pt-BR') 
                                                : 'Data inválida'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

