import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar } from './components/Sidebar';
import { QuickAdd } from './components/QuickAdd';
import { VoiceCommand } from './components/VoiceCommand';
import { HomePage } from './pages/HomePage';
import { SwipePage } from './pages/SwipePage';
import { WeatherPage } from './pages/WeatherPage';
import { KanbanPage } from './pages/KanbanPage';
import { SessionsPage } from './pages/SessionsPage';
import { LeadGenPage } from './pages/LeadGenPage';
import { AgreementsPage } from './pages/AgreementsPage';
import { BuffersPage } from './pages/BuffersPage';
import { CalendarSyncPage } from './pages/CalendarSyncPage';
import { TravelPage } from './pages/TravelPage';
import { TravelContactsPage } from './pages/TravelContactsPage';
import { IdentityLabPage } from './pages/IdentityLabPage';
import { DelegationPage } from './pages/DelegationPage';
import { ClientsPage } from './pages/ClientsPage';
import { AccountingPage } from './pages/AccountingPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { MessagingPage, StatementBoxPage } from './pages/StatementBoxPage';
import { SelfDevPage } from './pages/SelfDevPage';
import { CoachingPage } from './pages/CoachingPage';
import { MusicPage } from './pages/MusicPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { MODERN_ROUTES, openLegacy, pushModernRoute, routeFromLocation } from './navigation';
import type { RouteKey } from './types';
import './styles.css';

function App() {
  const [route, setRoute] = useState<RouteKey>(routeFromLocation), [quickOpen, setQuickOpen] = useState(false), [quickKind, setQuickKind] = useState<'swipe' | 'idea' | 'tracker' | undefined>(), [swipeRefresh, setSwipeRefresh] = useState(0);
  const navigate = useCallback((next: RouteKey) => { setRoute(next); if (MODERN_ROUTES.has(next)) pushModernRoute(next); else openLegacy(next); }, []);
  const openQuick = useCallback((kind?: 'swipe' | 'idea' | 'tracker') => { setQuickKind(kind); setQuickOpen(true); }, []);
  useEffect(() => { document.body.classList.add('modern-shell'); return () => document.body.classList.remove('modern-shell'); }, []);
  useEffect(() => { const back = () => setRoute(routeFromLocation()); window.addEventListener('popstate', back); window.addEventListener('hashchange', back); return () => { window.removeEventListener('popstate', back); window.removeEventListener('hashchange', back); }; }, []);
  // a React page's (hidden) old tab button, hotkey or quick jump asks for it (tab-registry.js)
  useEffect(() => { const open = (event: Event) => { const next = (event as CustomEvent<RouteKey>).detail; if (next) navigate(next); }; window.addEventListener('callstudio:open-route', open); return () => window.removeEventListener('callstudio:open-route', open); }, [navigate]);
  useEffect(() => {
    const legacyRoute = (event: Event) => { const next = (event as CustomEvent<RouteKey>).detail; if (next) setRoute(next); };
    window.addEventListener('callstudio:legacy-route', legacyRoute);
    return () => window.removeEventListener('callstudio:legacy-route', legacyRoute);
  }, []);
  useEffect(() => { const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !(e.target as HTMLElement)?.closest('input,textarea')) { e.preventDefault(); openQuick(); } }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [openQuick]);
  return <>
    <VoiceCommand onNavigate={navigate} />
    <Sidebar active={route} onNavigate={navigate} onAdd={() => openQuick()} />
    {route === 'home' && <div className="modern-content"><HomePage onNavigate={navigate} onAdd={openQuick} /></div>}
    {route === 'swipe' && <div className="modern-content"><SwipePage refreshToken={swipeRefresh} onAddLink={() => openQuick('swipe')} /></div>}
    {route === 'purchase' && <div className="modern-content legacy-doc-page"><PurchasesPage /></div>}
    {route === 'music' && <div className="modern-content"><MusicPage /></div>}
    {route === 'coaching' && <div className="modern-content legacy-doc-page"><CoachingPage onNavigate={navigate} /></div>}
    {route === 'selfdev' && <div className="modern-content legacy-doc-page"><SelfDevPage /></div>}
    {route === 'statementbox' && <div className="modern-content legacy-doc-page"><StatementBoxPage /></div>}
    {route === 'messaging' && <div className="modern-content legacy-doc-page"><MessagingPage /></div>}
    {route === 'resources' && <div className="modern-content resources-page"><ResourcesPage /></div>}
    {route === 'clients' && <div className="modern-content legacy-doc-page clients-page"><ClientsPage /></div>}
    {route === 'accounting' && <div className="modern-content legacy-doc-page"><AccountingPage /></div>}
    {route === 'delegation' && <div className="modern-content legacy-doc-page"><DelegationPage /></div>}
    {route === 'buffers' && <div className="modern-content legacy-doc-page"><BuffersPage /></div>}
    {route === 'identitylab' && <div className="modern-content legacy-doc-page"><IdentityLabPage /></div>}
    {route === 'travel' && <div className="modern-content legacy-doc-page"><TravelPage /></div>}
    {route === 'travelcontacts' && <div className="modern-content legacy-doc-page"><TravelContactsPage /></div>}
    {route === 'calsync' && <div className="modern-content legacy-doc-page"><CalendarSyncPage /></div>}
    {route === 'agreements' && <div className="modern-content agreements-page"><AgreementsPage /></div>}
    {route === 'leadgen' && <div className="modern-content leadgen-page"><LeadGenPage /></div>}
    {route === 'sessions' && <div className="modern-content"><SessionsPage onNavigate={navigate} /></div>}
    {route === 'kanban' && <div className="modern-content"><KanbanPage /></div>}
    {route === 'weather' && <div className="modern-content"><WeatherPage /></div>}
    <QuickAdd open={quickOpen} initial={quickKind || null} onClose={() => setQuickOpen(false)} onNavigate={navigate} onSwipeAdded={() => { setSwipeRefresh(n => n + 1); setRoute('swipe'); pushModernRoute('swipe'); }} />
  </>;
}

const root = document.getElementById('modern-root');
if (root) createRoot(root).render(<StrictMode><App /></StrictMode>);
