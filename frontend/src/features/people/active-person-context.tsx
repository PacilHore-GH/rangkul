"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, CurrentUser, Person } from "@/lib/api";

type ActivePersonContextValue = {
  people: Person[];
  activePerson: Person | null;
  activePersonId: string | null;
  loading: boolean;
  selectPerson: (id: string) => void;
  refreshPeople: () => Promise<void>;
};

const ActivePersonContext = createContext<ActivePersonContextValue | null>(null);
const STORAGE_PREFIX = "rangkul:active-person:";

export function clearActivePersonSelections() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key);
  }
}

export function ActivePersonProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshPeople = useCallback(async () => {
    const [user, nextPeople] = await Promise.all([
      api<CurrentUser>("/auth/me"),
      api<Person[]>("/people"),
    ]);
    const storageKey = `${STORAGE_PREFIX}${user.id}`;
    const stored = localStorage.getItem(storageKey);
    const selected = nextPeople.some((person) => person.id === stored) ? stored : nextPeople[0]?.id ?? null;
    setUserId(user.id);
    setPeople(nextPeople);
    setActivePersonId(selected);
    if (selected) localStorage.setItem(storageKey, selected);
    else localStorage.removeItem(storageKey);
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.all([
      api<CurrentUser>("/auth/me"),
      api<Person[]>("/people"),
    ]).then(([user, nextPeople]) => {
      const storageKey = `${STORAGE_PREFIX}${user.id}`;
      const stored = localStorage.getItem(storageKey);
      const selected = nextPeople.some((person) => person.id === stored)
        ? stored : nextPeople[0]?.id ?? null;
      setUserId(user.id);
      setPeople(nextPeople);
      setActivePersonId(selected);
      if (selected) localStorage.setItem(storageKey, selected);
      else localStorage.removeItem(storageKey);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function selectPerson(id: string) {
    if (!people.some((person) => person.id === id)) return;
    setActivePersonId(id);
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, id);
  }

  return <ActivePersonContext.Provider value={{
    people,
    activePerson: people.find((person) => person.id === activePersonId) ?? null,
    activePersonId,
    loading,
    selectPerson,
    refreshPeople,
  }}>{children}</ActivePersonContext.Provider>;
}

export function useActivePerson() {
  const context = useContext(ActivePersonContext);
  if (!context) throw new Error("useActivePerson harus digunakan di dalam ActivePersonProvider.");
  return context;
}
