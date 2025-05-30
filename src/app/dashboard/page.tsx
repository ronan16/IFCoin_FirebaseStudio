
// src/app/dashboard/page.tsx
"use client";

import { StudentDashboard } from '@/components/dashboards/StudentDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { TeacherDashboard } from '@/components/dashboards/TeacherDashboard';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let roleFromDb = 'student'; // Default

        if (userDocSnap.exists()) {
          roleFromDb = userDocSnap.data()?.role || 'student';
        } else {
          // Fallback for hardcoded admin if Firestore profile is missing
          if (user.email === 'admin@admin.com') {
             roleFromDb = 'admin';
          }
          console.warn("User document not found in Firestore for UID:", user.uid, "- defaulting role.");
        }
        setUserRole(roleFromDb);

        // Redirect based on role if on base /dashboard path
        // This ensures users go to their specific main dashboard if they land on /dashboard
        if (pathname === '/dashboard' || pathname === '/dashboard/') {
          if (roleFromDb === 'admin') {
            router.replace('/dashboard/admin');
          } else if (roleFromDb === 'teacher' || roleFromDb === 'staff') {
            router.replace('/dashboard/teacher');
          }
          // For 'student', they stay on /dashboard which renders StudentDashboard
        }

      } else {
        router.replace('/'); // No user, redirect to login
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render specific dashboard based on the current path and confirmed userRole
  // This part handles rendering if the user directly navigates to /dashboard/admin or /dashboard/teacher
  if (pathname === '/dashboard/admin' && userRole === 'admin') {
    return <AdminDashboard />;
  }
  if (pathname === '/dashboard/teacher' && (userRole === 'teacher' || userRole === 'staff')) {
    return <TeacherDashboard />;
  }
  // Default to StudentDashboard if role is student and path is /dashboard
  if (userRole === 'student' && (pathname === '/dashboard' || pathname === '/dashboard/')) {
      return <StudentDashboard />;
  }
  
  // Fallback for scenarios where path and role might mismatch after initial load/redirect
  // or if still waiting for the redirect from the useEffect to complete.
  // This should ideally not be hit often if redirects are clean.
  return (
     <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando seu painel...</p>
      </div>
  );
}
