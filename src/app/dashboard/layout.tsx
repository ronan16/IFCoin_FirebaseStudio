// src/app/dashboard/layout.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/sidebar"; // Adjusted import path
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

// Mock user data - replace with actual user data fetching logic
const userData = {
  name: "Admin User",
  email: "admin@ifpr.edu.br",
  role: "admin", // or 'teacher', 'admin'
  avatarUrl: "https://picsum.photos/id/42/40/40", // Placeholder avatar
  initials: "AU",
  coins: 9999, // Example coin balance
};

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: ('student' | 'teacher' | 'staff' | 'admin')[];
  disabled?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Início", roles: ['student', 'teacher', 'staff', 'admin'] },
  { href: "/dashboard/shop", icon: ShoppingBag, label: "Loja", roles: ['student'] },
  { href: "/dashboard/collection", icon: LayoutGrid, label: "Coleção", roles: ['student'] },
  { href: "/dashboard/trades", icon: Repeat, label: "Trocas", roles: ['student'] },
  { href: "/dashboard/events", icon: Calendar, label: "Eventos", roles: ['student', 'teacher', 'staff', 'admin'] },
  { href: "/dashboard/rankings", icon: Trophy, label: "Rankings", roles: ['student', 'teacher', 'staff', 'admin'] },
  { href: "/dashboard/teacher", icon: Users, label: "Painel Professor", roles: ['teacher', 'staff'] },
  { href: "/dashboard/admin", icon: UserCog, label: "Painel Admin", roles: ['admin'] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => item.roles.includes(userData.role as any));

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
           <div className="flex items-center gap-2 justify-center group-data-[collapsible=icon]:justify-center">
                {/* Placeholder Logo */}
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
                    isActive={pathname === item.href}
                    disabled={item.disabled}
                    tooltip={item.label}
                    aria-label={item.label}
                    className={cn(
                        "justify-start",
                        pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
           <Link href="/" passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                tooltip="Sair"
                aria-label="Sair"
                className="justify-start text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
              >
                 <a>
                   <LogOut className="h-4 w-4 shrink-0" />
                   <span className="group-data-[collapsible=icon]:hidden">Sair</span>
                 </a>
              </SidebarMenuButton>
           </Link>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2">
             <SidebarTrigger className="md:hidden" />
             <h1 className="text-lg font-semibold text-foreground hidden sm:block">
               {navItems.find(item => item.href === pathname)?.label || "Dashboard"}
             </h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Coin Balance (only for students) */}
             {userData.role === 'student' && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary">
                   <Coins className="h-5 w-5 text-yellow-500" />
                   <span className="font-semibold text-sm text-foreground">{userData.coins}</span>
                </div>
             )}

             {/* Notifications */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="rounded-full relative">
                      <Bell className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs bg-destructive text-destructive-foreground">3</Badge> {/* Example notification count */}
                      <span className="sr-only">Notificações</span>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem>Nova proposta de troca recebida!</DropdownMenuItem>
                   <DropdownMenuItem>Você ganhou 10 IFCoins!</DropdownMenuItem>
                   <DropdownMenuItem>Carta Lendária adicionada à Loja!</DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem>Ver todas</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>

             {/* User Menu */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-8 w-8">
                         <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                         <AvatarFallback>{userData.initials}</AvatarFallback>
                      </Avatar>
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                   <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                         <p className="text-sm font-medium leading-none">{userData.name}</p>
                         <p className="text-xs leading-none text-muted-foreground">
                            {userData.email}
                         </p>
                         <Badge variant="outline" className="w-fit mt-1 capitalize">{userData.role}</Badge>
                      </div>
                   </DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem>
                      <UserCog className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                   </DropdownMenuItem>
                   <DropdownMenuItem>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => window.location.href = '/'}> {/* Simple logout redirect */}
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                   </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-secondary/50 page-transition">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
