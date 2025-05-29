
// src/app/dashboard/page.tsx
"use client";

import { StudentDashboard } from '@/components/dashboards/StudentDashboard';
// AdminDashboard and TeacherDashboard will be rendered by their specific routes
// e.g., /dashboard/admin will render AdminDashboard via src/app/dashboard/admin/page.tsx

export default function DashboardPage() {
  // This page (/dashboard) is now primarily the landing page for students.
  // Admin users are redirected to /dashboard/admin by the LoginForm.
  // The DashboardLayout handles displaying appropriate nav items based on the current path.
  return <StudentDashboard />;
}
