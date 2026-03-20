import { create } from "zustand"
import { useAuthStore } from "../auth/authStore"

export type SetupMode = "manual" | "purchases" | null

export type UserAllotmentState = {
  manualStartingAllotment: number | null
  manualSetupCompletedAt: string | null
  setupMode: SetupMode
  hasCompletedInitialSetup: boolean
}

type AllotmentStore = {
  allotment: UserAllotmentState
  loadAllotmentForCurrentUser: () => void
  setManualStartingAllotment: (grams: number) => void
  setSetupMode: (mode: SetupMode) => void
  completeInitialSetup: () => void
  resetAllotmentSetup: () => void
}

const DEFAULT_ALLOTMENT_STATE: UserAllotmentState = {
  manualStartingAllotment: null,
  manualSetupCompletedAt: null,
  setupMode: null,
  hasCompletedInitialSetup: false,
}

function getCurrentUserStorageKey(currentUser: unknown) {
  if (!currentUser) return null

  if (typeof currentUser === "string") {
    return currentUser.toLowerCase()
  }

  if (
    typeof currentUser === "object" &&
    currentUser !== null &&
    "id" in currentUser &&
    typeof currentUser.id === "string"
  ) {
    return currentUser.id.toLowerCase()
  }

  return null
}

function getAllotmentStorageKey(userKey: string) {
  return `budbalance-allotment-${userKey}`
}

function normalizeAllotment(raw: any): UserAllotmentState {
  const parsedManual =
    typeof raw?.manualStartingAllotment === "number" &&
    raw.manualStartingAllotment >= 0
      ? raw.manualStartingAllotment
      : null

  const parsedManualSetupCompletedAt =
    typeof raw?.manualSetupCompletedAt === "string" &&
    raw.manualSetupCompletedAt.trim().length > 0
      ? raw.manualSetupCompletedAt
      : null

  const parsedMode: SetupMode =
    raw?.setupMode === "manual" || raw?.setupMode === "purchases"
      ? raw.setupMode
      : null

  const parsedCompleted =
    typeof raw?.hasCompletedInitialSetup === "boolean"
      ? raw.hasCompletedInitialSetup
      : false

  return {
    manualStartingAllotment: parsedManual,
    manualSetupCompletedAt: parsedManualSetupCompletedAt,
    setupMode: parsedMode,
    hasCompletedInitialSetup: parsedCompleted,
  }
}

function loadAllotment(userKey: string): UserAllotmentState {
  const saved = localStorage.getItem(getAllotmentStorageKey(userKey))

  if (!saved) return DEFAULT_ALLOTMENT_STATE

  try {
    const parsed = JSON.parse(saved)
    return normalizeAllotment(parsed)
  } catch {
    return DEFAULT_ALLOTMENT_STATE
  }
}

function saveAllotment(userKey: string, allotment: UserAllotmentState) {
  localStorage.setItem(getAllotmentStorageKey(userKey), JSON.stringify(allotment))
}

export const useAllotmentStore = create<AllotmentStore>((set, get) => ({
  allotment: DEFAULT_ALLOTMENT_STATE,

  loadAllotmentForCurrentUser: () => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) {
      set({ allotment: DEFAULT_ALLOTMENT_STATE })
      return
    }

    const userAllotment = loadAllotment(userKey)
    saveAllotment(userKey, userAllotment)
    set({ allotment: userAllotment })
  },

  setManualStartingAllotment: (grams) => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)
    const safeGrams = Number(grams)

    if (!userKey || Number.isNaN(safeGrams) || safeGrams < 0) return

    const updatedAllotment: UserAllotmentState = {
      ...get().allotment,
      manualStartingAllotment: safeGrams,
      manualSetupCompletedAt: new Date().toISOString(),
      setupMode: "manual",
    }

    saveAllotment(userKey, updatedAllotment)
    set({ allotment: updatedAllotment })
  },

  setSetupMode: (mode) => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) return

    const updatedAllotment: UserAllotmentState = {
      ...get().allotment,
      setupMode: mode,
    }

    saveAllotment(userKey, updatedAllotment)
    set({ allotment: updatedAllotment })
  },

  completeInitialSetup: () => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) return

    const updatedAllotment: UserAllotmentState = {
      ...get().allotment,
      hasCompletedInitialSetup: true,
    }

    saveAllotment(userKey, updatedAllotment)
    set({ allotment: updatedAllotment })
  },

  resetAllotmentSetup: () => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) {
      set({ allotment: DEFAULT_ALLOTMENT_STATE })
      return
    }

    saveAllotment(userKey, DEFAULT_ALLOTMENT_STATE)
    set({ allotment: DEFAULT_ALLOTMENT_STATE })
  },
}))