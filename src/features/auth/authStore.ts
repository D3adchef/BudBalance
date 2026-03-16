import { create } from "zustand"

type UserAccount = {
  username: string
  password: string
}

type AuthStore = {
  users: UserAccount[]
  currentUser: string | null
  signup: (username: string, password: string) => { success: boolean; message: string }
  login: (username: string, password: string) => { success: boolean; message: string }
  logout: () => void
}

const USERS_STORAGE_KEY = "budbalance-users"
const CURRENT_USER_STORAGE_KEY = "budbalance-current-user"

function loadUsers(): UserAccount[] {
  const saved = localStorage.getItem(USERS_STORAGE_KEY)
  return saved ? JSON.parse(saved) : []
}

function loadCurrentUser(): string | null {
  return localStorage.getItem(CURRENT_USER_STORAGE_KEY)
}

function saveUsers(users: UserAccount[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

function saveCurrentUser(username: string | null) {
  if (username) {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, username)
  } else {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  users: loadUsers(),
  currentUser: loadCurrentUser(),

  signup: (username, password) => {
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()

    if (!trimmedUsername || !trimmedPassword) {
      return { success: false, message: "Username and password are required." }
    }

    const existingUser = get().users.find(
      (user) => user.username.toLowerCase() === trimmedUsername.toLowerCase()
    )

    if (existingUser) {
      return { success: false, message: "That username already exists." }
    }

    const updatedUsers = [
      ...get().users,
      { username: trimmedUsername, password: trimmedPassword },
    ]

    saveUsers(updatedUsers)
    saveCurrentUser(trimmedUsername)

    set({
      users: updatedUsers,
      currentUser: trimmedUsername,
    })

    return { success: true, message: "Account created successfully." }
  },

  login: (username, password) => {
    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()

    const matchedUser = get().users.find(
      (user) =>
        user.username.toLowerCase() === trimmedUsername.toLowerCase() &&
        user.password === trimmedPassword
    )

    if (!matchedUser) {
      return { success: false, message: "Invalid username or password." }
    }

    saveCurrentUser(matchedUser.username)

    set({
      currentUser: matchedUser.username,
    })

    return { success: true, message: "Login successful." }
  },

  logout: () => {
    saveCurrentUser(null)
    set({ currentUser: null })
  },
}))