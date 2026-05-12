import { AuthGuard } from '@/components/layout/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden relative" style={{ background: 'var(--bg)' }}>
        <Sidebar />
        <main className="flex-1 overflow-hidden min-w-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
