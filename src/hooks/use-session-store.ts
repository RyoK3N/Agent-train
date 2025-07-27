
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Message, Stats } from '@/app/dashboard/page';
import type { AnalyzePerformanceOutput } from '@/ai/flows/analyze-performance-flow';

export interface Session {
    id: string;
    name: string;
    type: 'AI vs AI' | 'Live Training';
    savedAt: string;
    messages: Message[];
    stats?: Stats;
    analysis?: AnalyzePerformanceOutput | null;
    transcript: string;
}

interface SessionState {
  sessions: Session[];
  addSession: (session: Session) => void;
  getSession: (id: string) => Session | undefined;
  deleteSession: (id: string) => void;
  updateSessionName: (id: string, name: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
      getSession: (id) => get().sessions.find((session) => session.id === id),
      deleteSession: (id) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
      updateSessionName: (id, name) => set(state => ({
        sessions: state.sessions.map(s => s.id === id ? {...s, name} : s)
      })),
    }),
    {
      name: 'vocalis-ai-sessions', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);
