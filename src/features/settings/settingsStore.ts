import { create } from "zustand"
import { useAuthStore } from "../auth/authStore"

export type UserSettings = {
  allotmentLimit: number
}

type SettingsStore = {
  settings: UserSettings
  loadSettingsForCurrentUser: () => void
  setAllotmentLimit: (grams: number) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS: UserSettings = {
  allotmentLimit: 84.03,
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

function getSettingsStorageKey(userKey: string) {
  return `budbalance-settings-${userKey}`
}

function normalizeSettings(raw: any): UserSettings {
  const parsedLimit =
    typeof raw?.allotmentLimit === "number" && raw.allotmentLimit > 0
      ? raw.allotmentLimit
      : DEFAULT_SETTINGS.allotmentLimit

  return {
    allotmentLimit: parsedLimit === 70 ? 84.03 : parsedLimit,
  }
}

function loadSettings(userKey: string): UserSettings {
  const saved = localStorage.getItem(getSettingsStorageKey(userKey))

  if (!saved) return DEFAULT_SETTINGS

  try {
    const parsed = JSON.parse(saved)
    return normalizeSettings(parsed)
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(userKey: string, settings: UserSettings) {
  localStorage.setItem(getSettingsStorageKey(userKey), JSON.stringify(settings))
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  loadSettingsForCurrentUser: () => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) {
      set({ settings: DEFAULT_SETTINGS })
      return
    }

    const userSettings = loadSettings(userKey)
    saveSettings(userKey, userSettings)
    set({ settings: userSettings })
  },

  setAllotmentLimit: (grams) => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)
    const safeGrams = Number(grams)

    if (!userKey || !safeGrams || safeGrams <= 0) return

    const updatedSettings = {
      ...get().settings,
      allotmentLimit: safeGrams,
    }

    saveSettings(userKey, updatedSettings)
    set({ settings: updatedSettings })
  },

  resetSettings: () => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) {
      set({ settings: DEFAULT_SETTINGS })
      return
    }

    saveSettings(userKey, DEFAULT_SETTINGS)
    set({ settings: DEFAULT_SETTINGS })
  },
}))