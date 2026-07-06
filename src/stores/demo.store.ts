"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DemoUser } from "@/lib/constants";

interface DemoState {
  currentUser: DemoUser | null;
  setUser: (user: DemoUser) => void;
  reset: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      currentUser: null,
      setUser: (user) => set({ currentUser: user }),
      reset: () => set({ currentUser: null }),
    }),
    { name: "madrasati-demo" }
  )
);
