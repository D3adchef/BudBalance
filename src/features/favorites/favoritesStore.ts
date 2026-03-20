import { create } from "zustand"
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
  loadFavoritesForCurrentUser: () => void
  addFavoriteDispensary: (name: string) => void
  removeFavoriteDispensary: (name: string) => void
  addFavoritePurchase: (purchase: Omit<FavoritePurchase, "id">) => void
  removeFavoritePurchase: (id: string) => void
  clearFavorites: () => void
}

type StoredFavorites = {
  favoriteDispensaries: string[]
  favoritePurchases: FavoritePurchase[]
}

const DEFAULT_FAVORITES: StoredFavorites = {
  favoriteDispensaries: [],
  favoritePurchases: [],
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

function getFavoritesStorageKey(userKey: string) {
  return `budbalance-favorites-${userKey}`
}

function normalizeFavorites(raw: any): StoredFavorites {
  const favoriteDispensaries = Array.isArray(raw?.favoriteDispensaries)
    ? raw.favoriteDispensaries
        .map((item: unknown) => String(item ?? "").trim())
        .filter(Boolean)
    : []

  const favoritePurchases = Array.isArray(raw?.favoritePurchases)
    ? raw.favoritePurchases.map((item: any) => ({
        id: item?.id ?? crypto.randomUUID(),
        name: String(item?.name ?? "").trim(),
        category: String(item?.category ?? "").trim(),
        grams: Number(item?.grams ?? 0),
      }))
    : []

  return {
    favoriteDispensaries,
    favoritePurchases: favoritePurchases.filter(
      (item: FavoritePurchase) =>
        item.name && item.category && item.grams > 0
    ),
  }
}

function loadFavorites(userKey: string): StoredFavorites {
  const saved = localStorage.getItem(getFavoritesStorageKey(userKey))

  if (!saved) return DEFAULT_FAVORITES

  try {
    const parsed = JSON.parse(saved)
    return normalizeFavorites(parsed)
  } catch {
    return DEFAULT_FAVORITES
  }
}

function saveFavorites(userKey: string, favorites: StoredFavorites) {
  localStorage.setItem(getFavoritesStorageKey(userKey), JSON.stringify(favorites))
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favoriteDispensaries: [],
  favoritePurchases: [],

  loadFavoritesForCurrentUser: () => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) {
      set(DEFAULT_FAVORITES)
      return
    }

    const userFavorites = loadFavorites(userKey)
    saveFavorites(userKey, userFavorites)

    set({
      favoriteDispensaries: userFavorites.favoriteDispensaries,
      favoritePurchases: userFavorites.favoritePurchases,
    })
  },

  addFavoriteDispensary: (name) => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)
    const trimmed = name.trim()

    if (!userKey || !trimmed) return

    const alreadyExists = get().favoriteDispensaries.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    )

    if (alreadyExists) return

    const updatedFavorites: StoredFavorites = {
      favoriteDispensaries: [...get().favoriteDispensaries, trimmed],
      favoritePurchases: get().favoritePurchases,
    }

    saveFavorites(userKey, updatedFavorites)
    set(updatedFavorites)
  },

  removeFavoriteDispensary: (name) => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) return

    const updatedFavorites: StoredFavorites = {
      favoriteDispensaries: get().favoriteDispensaries.filter(
        (item) => item !== name
      ),
      favoritePurchases: get().favoritePurchases,
    }

    saveFavorites(userKey, updatedFavorites)
    set(updatedFavorites)
  },

  addFavoritePurchase: (purchase) => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) return

    const name = purchase.name.trim()
    const category = purchase.category.trim()
    const grams = Number(purchase.grams)

    if (!name || !category || grams <= 0) return

    const updatedFavorites: StoredFavorites = {
      favoriteDispensaries: get().favoriteDispensaries,
      favoritePurchases: [
        ...get().favoritePurchases,
        {
          id: crypto.randomUUID(),
          name,
          category,
          grams,
        },
      ],
    }

    saveFavorites(userKey, updatedFavorites)
    set(updatedFavorites)
  },

  removeFavoritePurchase: (id) => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) return

    const updatedFavorites: StoredFavorites = {
      favoriteDispensaries: get().favoriteDispensaries,
      favoritePurchases: get().favoritePurchases.filter((item) => item.id !== id),
    }

    saveFavorites(userKey, updatedFavorites)
    set(updatedFavorites)
  },

  clearFavorites: () => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) {
      set(DEFAULT_FAVORITES)
      return
    }

    saveFavorites(userKey, DEFAULT_FAVORITES)
    set(DEFAULT_FAVORITES)
  },
}))