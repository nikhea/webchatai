import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ComposerState = {
  modelName: string;
  providerId: string;
  providerName: string;
  webSearchEnabled: boolean;
  setModel: (modelName: string, providerId: string, providerName: string) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
};

export const useComposerStore = create<ComposerState>()(
  persist(
    (set) => ({
      modelName: "Gemini 3 Flash",
      providerId: "gemini",
      providerName: "Google Gemini",
      webSearchEnabled: false,
      setModel: (modelName, providerId, providerName) => set({ modelName, providerId, providerName }),
      setWebSearchEnabled: (webSearchEnabled) => set({ webSearchEnabled }),
    }),
    {
      name: "composer-storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : undefined as any)),
      partialize: (state) => ({
        modelName: state.modelName,
        providerId: state.providerId,
        providerName: state.providerName,
        webSearchEnabled: state.webSearchEnabled,
      }),
    },
  ),
);

export const composerState = {
  get modelName() {
    return useComposerStore.getState().modelName;
  },
  set modelName(v: string) {
    const s = useComposerStore.getState();
    s.setModel(v, s.providerId, s.providerName);
  },
  get providerId() {
    return useComposerStore.getState().providerId;
  },
  set providerId(v: string) {
    const s = useComposerStore.getState();
    s.setModel(s.modelName, v, s.providerName);
  },
  get providerName() {
    return useComposerStore.getState().providerName;
  },
  set providerName(v: string) {
    const s = useComposerStore.getState();
    s.setModel(s.modelName, s.providerId, v);
  },
  get webSearchEnabled() {
    return useComposerStore.getState().webSearchEnabled;
  },
  set webSearchEnabled(v: boolean) {
    useComposerStore.getState().setWebSearchEnabled(v);
  },
};
