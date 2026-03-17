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

function getSettingsStorageKey(username: string) {
  return `budbalance-settings-${username.toLowerCase()}`
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

function loadSettings(username: string): UserSettings {
  const saved = localStorage.getItem(getSettingsStorageKey(username))

  if (!saved) return DEFAULT_SETTINGS

  try {
    const parsed = JSON.parse(saved)
    return normalizeSettings(parsed)
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(username: string, settings: UserSettings) {
  localStorage.setItem(getSettingsStorageKey(username), JSON.stringify(settings))
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  loadSettingsForCurrentUser: () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({ settings: DEFAULT_SETTINGS })
      return
    }

    const userSettings = loadSettings(currentUser)
    saveSettings(currentUser, userSettings)
    set({ settings: userSettings })
  },

  setAllotmentLimit: (grams) => {
    const currentUser = useAuthStore.getState().currentUser
    const safeGrams = Number(grams)

    if (!currentUser || !safeGrams || safeGrams <= 0) return

    const updatedSettings = {
      ...get().settings,
      allotmentLimit: safeGrams,
    }

    saveSettings(currentUser, updatedSettings)
    set({ settings: updatedSettings })
  },

  resetSettings: () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({ settings: DEFAULT_SETTINGS })
      return
    }

    saveSettings(currentUser, DEFAULT_SETTINGS)
    set({ settings: DEFAULT_SETTINGS })
  },
}))