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
        if (userDocSnap.exists()) {
          const roleFromDb = userDocSnap.data()?.role || 'student';
          setUserRole(roleFromDb);

          // Redirect based on role if on base /dashboard path
          if (pathname === '/dashboard') {
            if (roleFromDb === 'admin') {
              router.replace('/dashboard/admin');
            } else if (roleFromDb === 'teacher') {
              router.replace('/dashboard/teacher');
            }
            // Student remains on /dashboard
          }

        } else {
           // Fallback for hardcoded admin or if Firestore profile is missing
          if (user.email === 'admin@admin.com') {
             setUserRole('admin');
             if (pathname === '/dashboard') router.replace('/dashboard/admin');
          } else {
            setUserRole('student'); // Default to student
          }
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

  // This component will now mostly act as a router or loader.
  // The actual dashboard content is rendered by specific role pages
  // or the StudentDashboard if the user is a student and on /dashboard.

  if (pathname === '/dashboard/admin' && userRole === 'admin') {
    return <AdminDashboard />;
  }
  if (pathname === '/dashboard/teacher' && userRole === 'teacher') {
    return <TeacherDashboard />;
  }
  // Default to StudentDashboard if role is student or if on /dashboard (after potential redirect)
  if (userRole === 'student' && (pathname === '/dashboard' || pathname === '/dashboard/')) {
      return <StudentDashboard />;
  }
  
  // If the path doesn't match the role (e.g. student trying to access /dashboard/admin directly)
  // The layout's auth check might redirect them, or you could show an unauthorized message.
  // For now, returning null or a generic "loading/redirecting" is fine as the layout handles redirection.
  // Or, if the role hasn't matched any specific dashboard path yet but we are on /dashboard
  if (pathname === '/dashboard' && userRole === 'student') {
    return <StudentDashboard />;
  }


  // Fallback if roles/paths don't line up, or still loading/redirecting
  // This shouldn't typically be hit if redirects and loading state are correct
  return (
     <div className="flex h-screen items-center justify-center">
        <p>Carregando painel...</p>
      </div>
  );
}
