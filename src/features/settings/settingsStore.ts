import { create } from "zustand"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../auth/authStore"

export type UserSettings = {
  allotmentLimit: number
}

type SettingsStore = {
  settings: UserSettings
  isLoading: boolean
  loadSettingsForCurrentUser: () => Promise<void>
  setAllotmentLimit: (grams: number) => Promise<void>
  resetSettings: () => Promise<void>
}

type SettingsRow = {
  user_id: string
  allotment_limit: string | number
  created_at: string
  updated_at: string
}

const DEFAULT_SETTINGS: UserSettings = {
  allotmentLimit: 84.03,
}

function normalizeSettingsRow(row: SettingsRow): UserSettings {
  const parsedLimit = Number(row.allotment_limit)

  return {
    allotmentLimit:
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? parsedLimit === 70
          ? 84.03
          : parsedLimit
        : DEFAULT_SETTINGS.allotmentLimit,
  }
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  loadSettingsForCurrentUser: async () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({
        settings: DEFAULT_SETTINGS,
        isLoading: false,
      })
      return
    }

    set({ isLoading: true })

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle()

    if (error) {
      console.error("Failed to load settings:", error)
      set({
        settings: DEFAULT_SETTINGS,
        isLoading: false,
      })
      return
    }

    if (!data) {
      const { error: insertError } = await supabase.from("user_settings").insert({
        user_id: currentUser.id,
        allotment_limit: DEFAULT_SETTINGS.allotmentLimit,
      })

      if (insertError) {
        console.error("Failed to create default settings:", insertError)
        set({
          settings: DEFAULT_SETTINGS,
          isLoading: false,
        })
        return
      }

      set({
        settings: DEFAULT_SETTINGS,
        isLoading: false,
      })
      return
    }

    set({
      settings: normalizeSettingsRow(data as SettingsRow),
      isLoading: false,
    })
  },

  setAllotmentLimit: async (grams) => {
    const currentUser = useAuthStore.getState().currentUser
    const safeGrams = Number(grams)

    if (!currentUser || !safeGrams || safeGrams <= 0) return

    const updatedSettings: UserSettings = {
      allotmentLimit: safeGrams,
    }

    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: currentUser.id,
        allotment_limit: updatedSettings.allotmentLimit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      console.error("Failed to save settings:", error)
      throw new Error(error.message)
    }

    set({ settings: updatedSettings })
  },

  resetSettings: async () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({ settings: DEFAULT_SETTINGS })
      return
    }

    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: currentUser.id,
        allotment_limit: DEFAULT_SETTINGS.allotmentLimit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      console.error("Failed to reset settings:", error)
      throw new Error(error.message)
    }

    set({ settings: DEFAULT_SETTINGS })
  },
}))