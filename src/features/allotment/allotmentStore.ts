import { create } from "zustand"
import { supabase } from "../../lib/supabase"
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
  isLoading: boolean
  loadAllotmentForCurrentUser: () => Promise<void>
  setManualStartingAllotment: (grams: number) => Promise<void>
  setSetupMode: (mode: SetupMode) => Promise<void>
  completeInitialSetup: () => Promise<void>
  resetAllotmentSetup: () => Promise<void>
}

type AllotmentRow = {
  user_id: string
  manual_starting_allotment: string | number | null
  manual_setup_completed_at: string | null
  setup_mode: string | null
  has_completed_initial_setup: boolean
  created_at: string
  updated_at: string
}

const DEFAULT_ALLOTMENT_STATE: UserAllotmentState = {
  manualStartingAllotment: null,
  manualSetupCompletedAt: null,
  setupMode: null,
  hasCompletedInitialSetup: false,
}

function normalizeSetupMode(raw: unknown): SetupMode {
  if (raw === "manual" || raw === "purchases") return raw
  return null
}

function mapRowToAllotment(row: AllotmentRow): UserAllotmentState {
  return {
    manualStartingAllotment:
      row.manual_starting_allotment === null
        ? null
        : Number(row.manual_starting_allotment),
    manualSetupCompletedAt: row.manual_setup_completed_at,
    setupMode: normalizeSetupMode(row.setup_mode),
    hasCompletedInitialSetup: Boolean(row.has_completed_initial_setup),
  }
}

export const useAllotmentStore = create<AllotmentStore>((set, get) => ({
  allotment: DEFAULT_ALLOTMENT_STATE,
  isLoading: false,

  loadAllotmentForCurrentUser: async () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({
        allotment: DEFAULT_ALLOTMENT_STATE,
        isLoading: false,
      })
      return
    }

    set({ isLoading: true })

    const { data, error } = await supabase
      .from("allotment_state")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle()

    if (error) {
      console.error("Failed to load allotment state:", error)
      set({
        allotment: DEFAULT_ALLOTMENT_STATE,
        isLoading: false,
      })
      return
    }

    set({
      allotment: data ? mapRowToAllotment(data as AllotmentRow) : DEFAULT_ALLOTMENT_STATE,
      isLoading: false,
    })
  },

  setManualStartingAllotment: async (grams) => {
    const currentUser = useAuthStore.getState().currentUser
    const safeGrams = Number(grams)

    if (!currentUser || Number.isNaN(safeGrams) || safeGrams < 0) return

    const updatedAllotment: UserAllotmentState = {
      ...get().allotment,
      manualStartingAllotment: safeGrams,
      manualSetupCompletedAt: new Date().toISOString(),
      setupMode: "manual",
    }

    const { error } = await supabase.from("allotment_state").upsert(
      {
        user_id: currentUser.id,
        manual_starting_allotment: safeGrams,
        manual_setup_completed_at: updatedAllotment.manualSetupCompletedAt,
        setup_mode: updatedAllotment.setupMode,
        has_completed_initial_setup: updatedAllotment.hasCompletedInitialSetup,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      console.error("Failed to save manual starting allotment:", error)
      throw new Error(error.message)
    }

    set({ allotment: updatedAllotment })
  },

  setSetupMode: async (mode) => {
    const currentUser = useAuthStore.getState().currentUser
    if (!currentUser) return

    const updatedAllotment: UserAllotmentState = {
      ...get().allotment,
      setupMode: mode,
    }

    const { error } = await supabase.from("allotment_state").upsert(
      {
        user_id: currentUser.id,
        manual_starting_allotment: updatedAllotment.manualStartingAllotment,
        manual_setup_completed_at: updatedAllotment.manualSetupCompletedAt,
        setup_mode: updatedAllotment.setupMode,
        has_completed_initial_setup: updatedAllotment.hasCompletedInitialSetup,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      console.error("Failed to set setup mode:", error)
      throw new Error(error.message)
    }

    set({ allotment: updatedAllotment })
  },

  completeInitialSetup: async () => {
    const currentUser = useAuthStore.getState().currentUser
    if (!currentUser) return

    const updatedAllotment: UserAllotmentState = {
      ...get().allotment,
      hasCompletedInitialSetup: true,
    }

    const { error } = await supabase.from("allotment_state").upsert(
      {
        user_id: currentUser.id,
        manual_starting_allotment: updatedAllotment.manualStartingAllotment,
        manual_setup_completed_at: updatedAllotment.manualSetupCompletedAt,
        setup_mode: updatedAllotment.setupMode,
        has_completed_initial_setup: updatedAllotment.hasCompletedInitialSetup,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (error) {
      console.error("Failed to complete initial setup:", error)
      throw new Error(error.message)
    }

    set({ allotment: updatedAllotment })
  },

  resetAllotmentSetup: async () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({ allotment: DEFAULT_ALLOTMENT_STATE })
      return
    }

    const { error } = await supabase
      .from("allotment_state")
      .upsert(
        {
          user_id: currentUser.id,
          manual_starting_allotment: null,
          manual_setup_completed_at: null,
          setup_mode: null,
          has_completed_initial_setup: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (error) {
      console.error("Failed to reset allotment state:", error)
      throw new Error(error.message)
    }

    set({ allotment: DEFAULT_ALLOTMENT_STATE })
  },
}))