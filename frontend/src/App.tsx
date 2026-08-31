import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import GoalIntakePage from './pages/GoalIntakePage';
import LearnPage from './pages/LearnPage';
import DashboardPage from './pages/DashboardPage';

// ============================================================
// App — routing setup
// ============================================================

export default function App() {
  return (
    <Routes>
      {/* Goal intake — standalone (no shell) */}
      <Route path="/" element={<GoalIntakePage />} />

      {/* Learning graph — has shell */}
      <Route
        path="/learn"
        element={
          <AppShell>
            <LearnPage />
          </AppShell>
        }
      />

      {/* Dashboard */}
      <Route path="/dashboard" element={<DashboardPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
