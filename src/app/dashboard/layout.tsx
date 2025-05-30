
// src/app/dashboard/layout.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import {
  Home,
  ShoppingBag,
  LayoutGrid,
  Repeat,
  Calendar,
  Trophy,
  UserCog,
  Users,
  LogOut,
  Menu,
  Coins,
  Bell,
  Loader2,
  Award, // For Teacher Panel
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase/firebase"; 
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth"; 
import { doc, getDoc } from "firebase/firestore";


type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: ('student' | 'teacher' | 'staff' | 'admin')[];
  disabled?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Início", roles: ['student'] }, // Student only
  { href: "/dashboard/shop", icon: ShoppingBag, label: "Loja", roles: ['student'] },
  { href: "/dashboard/collection", icon: LayoutGrid, label: "Coleção", roles: ['student'] },
  { href: "/dashboard/trades", icon: Repeat, label: "Trocas", roles: ['student'] },
  { href: "/dashboard/events", icon: Calendar, label: "Eventos", roles: ['student', 'teacher', 'staff', 'admin'] },
  { href: "/dashboard/rankings", icon: Trophy, label: "Rankings", roles: ['student', 'teacher', 'staff', 'admin'] },
  { href: "/dashboard/teacher", icon: Award, label: "Painel Professor", roles: ['teacher', 'staff'] }, // Using Award icon
  { href: "/dashboard/admin", icon: UserCog, label: "Painel Admin", roles: ['admin'] },
];

interface UserProfile {
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'staff' | 'admin';
  avatarUrl?: string;
  initials: string;
  coins?: number; 
  course?: string; 
  turma?: string; // Added Turma
  uid: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoadingAuth(true);
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserProfile({
            uid: user.uid,
            name: data.name || "Usuário",
            email: user.email || "email@desconhecido.com",
            role: data.role || "student",
            course: data.course || "Não definido",
            turma: data.turma || "Não definida",
            initials: (data.name || "U").substring(0, 2).toUpperCase(),
            coins: data.coins, // Coins might be undefined for teachers/admins
            avatarUrl: data.avatarUrl, 
          });
        } else {
          // Fallback for hardcoded admin if Firestore profile is missing
          if (user.email === 'admin@admin.com') {
            setUserProfile({
                uid: user.uid,
                name: "Admin Master",
                email: user.email,
                role: 'admin',
                course: "Administração",
                turma: "N/A",
                initials: "AM",
                // coins: 9999, // Admins typically don't have game coins
             });
          } else { // Default to student if no doc and not admin email
            setUserProfile({
                uid: user.uid,
                name: user.displayName || "Usuário",
                email: user.email || "desconhecido@ifpr.edu.br",
                role: 'student', 
                course: "Não definido",
                turma: "Não definida",
                initials: (user.displayName || "U").substring(0,1).toUpperCase(),
                coins: 0,
            });
          }
          console.warn("User document not found in Firestore for UID:", user.uid, "- Using default/fallback profile.");
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        router.push("/"); 
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); 
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoadingAuth || !userProfile) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // Filter nav items based on user role
  // Also, specific redirect for /dashboard if user is not student
  let filteredNavItems = navItems.filter(item => userProfile && item.roles.includes(userProfile.role));
  if (userProfile.role === 'teacher' || userProfile.role === 'staff') {
      filteredNavItems = navItems.filter(item => item.roles.includes(userProfile.role) && item.href !== '/dashboard');
  } else if (userProfile.role === 'admin') {
      filteredNavItems = navItems.filter(item => item.roles.includes(userProfile.role) && item.href !== '/dashboard');
  }


  const currentNavItem = navItems.find(item => pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard'));
  
  let pageTitle = 'Painel';
  if (currentNavItem) {
    pageTitle = currentNavItem.label;
  } else if (pathname === '/dashboard' && userProfile.role === 'student') {
    pageTitle = 'Início';
  } else if (pathname.startsWith('/dashboard/admin') && userProfile.role === 'admin') {
    pageTitle = 'Painel Admin';
  } else if (pathname.startsWith('/dashboard/teacher') && (userProfile.role === 'teacher' || userProfile.role === 'staff')) {
    pageTitle = 'Painel Professor';
  }


  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
           <div className="flex items-center gap-2 justify-center group-data-[collapsible=icon]:justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-8 w-8 text-sidebar-primary">
                    <circle cx="50" cy="50" r="45" fill="currentColor" />
                    <text x="50" y="60" fontSize="30" fill="hsl(var(--sidebar-primary-foreground))" textAnchor="middle" fontWeight="bold">IF</text>
                </svg>
                <span className="font-bold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    IFCoins
                </span>
           </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            {filteredNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    disabled={item.disabled}
                    tooltip={item.label}
                    aria-label={item.label}
                    className={cn(
                        "justify-start",
                        (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <a>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-sidebar-border mt-auto">
           <SidebarMenuButton
             tooltip="Sair"
             aria-label="Sair"
             className="justify-start text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
             onClick={handleLogout}
           >
             <LogOut className="h-4 w-4 shrink-0" />
             <span className="group-data-[collapsible=icon]:hidden">Sair</span>
           </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2">
             <SidebarTrigger className="md:hidden" />
             <h1 className="text-lg font-semibold text-foreground hidden sm:block">
               {pageTitle}
             </h1>
          </div>

          <div className="flex items-center gap-4">
             {userProfile.role === 'student' && userProfile.coins !== undefined && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary">
                   <Coins className="h-5 w-5 text-yellow-500" />
                   <span className="font-semibold text-sm text-foreground">{userProfile.coins}</span>
                </div>
             )}

             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="rounded-full relative">
                      <Bell className="h-5 w-5" />
                      <span className="sr-only">Notificações</span>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem>Nenhuma notificação nova.</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>

             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-8 w-8">
                         <AvatarImage src={userProfile.avatarUrl || `https://avatar.vercel.sh/${userProfile.email}.png?size=40`} alt={userProfile.name} />
                         <AvatarFallback>{userProfile.initials}</AvatarFallback>
                      </Avatar>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                   <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                         <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                         <p className="text-xs leading-none text-muted-foreground">
                            {userProfile.email}
                         </p>
                         {userProfile.course && (userProfile.role === 'student' || userProfile.role === 'teacher') && ( // Show course for students and teachers
                            <p className="text-xs leading-none text-muted-foreground">
                                Curso: {userProfile.course}
                            </p>
                         )}
                         {userProfile.turma && userProfile.role === 'student' && ( // Show turma only for students
                            <p className="text-xs leading-none text-muted-foreground">
                                Turma: {userProfile.turma}
                            </p>
                         )}
                         <Badge variant="outline" className="w-fit mt-1 capitalize">{userProfile.role}</Badge>
                      </div>
                   </DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                   </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-secondary/50 page-transition">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
