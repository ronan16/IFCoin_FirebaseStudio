// src/app/dashboard/page.tsx
"use client"; // Required if using hooks like useState or useEffect for role-based rendering

import { StudentDashboard } from '@/components/dashboards/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboards/TeacherDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useEffect, useState } from 'react';

// Mock function to get user role - Replace with actual logic (e.g., fetch from context or API)
async function getUserRole(): Promise<'student' | 'teacher' | 'staff' | 'admin' | null> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, you'd fetch this based on the logged-in user
  return 'student'; // <-- Change this to 'teacher' or 'admin' to test different dashboards
}

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'staff' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserRole().then(role => {
      setUserRole(role);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  switch (userRole) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
    case 'staff':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      // Handle case where role is not determined or invalid
      return <div>Erro: Função de usuário desconhecida.</div>;
  }
}

// Skeleton component for loading state
function DashboardSkeleton() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg hidden lg:block" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
           <Skeleton className="h-48 rounded-lg" />
           <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }
