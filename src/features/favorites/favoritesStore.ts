import { create } from "zustand"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../auth/authStore"

export type FavoritePurchase = {
  id: string
  name: string
  category: string
  grams: number
}

type FavoritesStore = {
  favoriteDispensaries: string[]
  favoritePurchases: FavoritePurchase[]
  isLoading: boolean
  loadFavoritesForCurrentUser: () => Promise<void>
  addFavoriteDispensary: (name: string) => Promise<void>
  removeFavoriteDispensary: (name: string) => Promise<void>
  addFavoritePurchase: (purchase: Omit<FavoritePurchase, "id">) => Promise<void>
  removeFavoritePurchase: (id: string) => Promise<void>
  clearFavorites: () => Promise<void>
}

type FavoriteRow = {
  id: string
  user_id: string
  type: string
  name: string
  category: string | null
  grams: string | number | null
  created_at: string
}

function normalizeFavoritePurchase(row: FavoriteRow): FavoritePurchase {
  return {
    id: row.id,
    name: row.name ?? "",
    category: row.category ?? "",
    grams: Number(row.grams ?? 0),
  }
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favoriteDispensaries: [],
  favoritePurchases: [],
  isLoading: false,

  loadFavoritesForCurrentUser: async () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({
        favoriteDispensaries: [],
        favoritePurchases: [],
        isLoading: false,
      })
      return
    }

    set({ isLoading: true })

    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      const rows: FavoriteRow[] = Array.isArray(data) ? (data as FavoriteRow[]) : []

      const favoriteDispensaries = rows
        .filter((row) => row.type === "dispensary")
        .map((row) => row.name?.trim())
        .filter((name): name is string => Boolean(name))

      const favoritePurchases = rows
        .filter((row) => row.type === "product")
        .map(normalizeFavoritePurchase)
        .filter((item) => item.name && item.category && item.grams > 0)

      set({
        favoriteDispensaries,
        favoritePurchases,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      console.error("Failed to load favorites:", error)
      throw error
    }
  },

  addFavoriteDispensary: async (name) => {
    const currentUser = useAuthStore.getState().currentUser
    const trimmed = name.trim()

    if (!currentUser) {
      throw new Error("You must be logged in to save favorites.")
    }

    if (!trimmed) {
      throw new Error("Dispensary name is required.")
    }

    const alreadyExists = get().favoriteDispensaries.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    )

    if (alreadyExists) return

    const { data, error } = await supabase
      .from("user_favorites")
      .insert({
        user_id: currentUser.id,
        type: "dispensary",
        name: trimmed,
        category: null,
        grams: null,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to add favorite dispensary:", error)
      throw new Error(error.message)
    }

    const savedName =
      typeof data?.name === "string" && data.name.trim() ? data.name.trim() : trimmed

    set({
      favoriteDispensaries: [...get().favoriteDispensaries, savedName],
    })
  },

  removeFavoriteDispensary: async (name) => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      throw new Error("You must be logged in to remove favorites.")
    }

    const target = get().favoriteDispensaries.find(
      (item) => item.toLowerCase() === name.toLowerCase()
    )

    if (!target) return

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", currentUser.id)
      .eq("type", "dispensary")
      .eq("name", target)

    if (error) {
      console.error("Failed to remove favorite dispensary:", error)
      throw new Error(error.message)
    }

    set({
      favoriteDispensaries: get().favoriteDispensaries.filter(
        (item) => item.toLowerCase() !== name.toLowerCase()
      ),
    })
  },

  addFavoritePurchase: async (purchase) => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      throw new Error("You must be logged in to save favorites.")
    }

    const name = purchase.name.trim()
    const category = purchase.category.trim()
    const grams = Number(purchase.grams)

    if (!name) {
      throw new Error("Favorite purchase name is required.")
    }

    if (!category) {
      throw new Error("Favorite purchase category is required.")
    }

    if (!grams || grams <= 0) {
      throw new Error("Favorite purchase grams must be greater than 0.")
    }

    const { data, error } = await supabase
      .from("user_favorites")
      .insert({
        user_id: currentUser.id,
        type: "product",
        name,
        category,
        grams,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to add favorite purchase:", error)
      throw new Error(error.message)
    }

    set({
      favoritePurchases: [
        ...get().favoritePurchases,
        normalizeFavoritePurchase(data as FavoriteRow),
      ],
    })
  },

  removeFavoritePurchase: async (id) => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      throw new Error("You must be logged in to remove favorites.")
    }

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", currentUser.id)
      .eq("type", "product")
      .eq("id", id)

    if (error) {
      console.error("Failed to remove favorite purchase:", error)
      throw new Error(error.message)
    }

    set({
      favoritePurchases: get().favoritePurchases.filter((item) => item.id !== id),
    })
  },

  clearFavorites: async () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({
        favoriteDispensaries: [],
        favoritePurchases: [],
        isLoading: false,
      })
      return
    }

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", currentUser.id)

    if (error) {
      console.error("Failed to clear favorites:", error)
      throw new Error(error.message)
    }

    set({
      favoriteDispensaries: [],
      favoritePurchases: [],
      isLoading: false,
    })
  },
}))