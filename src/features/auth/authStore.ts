import { create } from "zustand"

export type UserAccount = {
  firstName: string
  lastName: string
  username: string
  email: string
  birthMonth: string
  birthDay: string
  birthYear: string
  mobile: string
  password: string
  createdAt: string
}

type SignupInput = {
  firstName: string
  lastName: string
  username: string
  email: string
  birthMonth: string
  birthDay: string
  birthYear: string
  mobile: string
  password: string
}

type UpdateCurrentUserInput = {
  firstName: string
  lastName: string
  email: string
  mobile: string
}

type AuthStore = {
  users: UserAccount[]
  currentUser: string | null
  signup: (data: SignupInput) => { success: boolean; message: string }
  login: (username: string, password: string) => { success: boolean; message: string }
  logout: () => void
  updateCurrentUser: (
    data: UpdateCurrentUserInput
  ) => { success: boolean; message: string }
  deleteCurrentUser: () => void
}

const USERS_STORAGE_KEY = "budbalance-users"
const CURRENT_USER_STORAGE_KEY = "budbalance-current-user"

function normalizeUser(raw: any): UserAccount {
  return {
    firstName: String(raw?.firstName ?? "").trim(),
    lastName: String(raw?.lastName ?? "").trim(),
    username: String(raw?.username ?? "").trim(),
    email: String(raw?.email ?? "").trim(),
    birthMonth: String(raw?.birthMonth ?? "").trim(),
    birthDay: String(raw?.birthDay ?? "").trim(),
    birthYear: String(raw?.birthYear ?? "").trim(),
    mobile: String(raw?.mobile ?? "").trim(),
    password: String(raw?.password ?? "").trim(),
    createdAt: String(raw?.createdAt ?? new Date().toISOString()).trim(),
  }
}

function isStrongPassword(password: string) {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password)

  return (
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    hasSpecialCharacter
  )
}

function loadUsers(): UserAccount[] {
  const saved = localStorage.getItem(USERS_STORAGE_KEY)

  if (!saved) return []

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.map(normalizeUser) : []
  } catch {
    return []
  }
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

  signup: (data) => {
    const newUser: UserAccount = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
      birthMonth: data.birthMonth.trim(),
      birthDay: data.birthDay.trim(),
      birthYear: data.birthYear.trim(),
      mobile: data.mobile.trim(),
      password: data.password.trim(),
      createdAt: new Date().toISOString(),
    }

    if (
      !newUser.lastName ||
      !newUser.username ||
      !newUser.email ||
      !newUser.password
    ) {
      return {
        success: false,
        message: "Please complete all required fields.",
      }
    }

    if (!isStrongPassword(newUser.password)) {
      return {
        success: false,
        message:
          "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character.",
      }
    }

    const existingUser = get().users.find(
      (user) => user.username.toLowerCase() === newUser.username.toLowerCase()
    )

    if (existingUser) {
      return {
        success: false,
        message: "That username already exists.",
      }
    }

    const updatedUsers = [...get().users, newUser]

    saveUsers(updatedUsers)
    saveCurrentUser(newUser.username)

    set({
      users: updatedUsers,
      currentUser: newUser.username,
    })

    return {
      success: true,
      message: "Account created successfully.",
    }
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

  updateCurrentUser: (data) => {
    const currentUser = get().currentUser
    if (!currentUser) {
      return { success: false, message: "No current user found." }
    }

    const trimmedLastName = data.lastName.trim()
    const trimmedEmail = data.email.trim()

    if (!trimmedLastName || !trimmedEmail) {
      return {
        success: false,
        message: "Last name and email are required.",
      }
    }

    const updatedUsers = get().users.map((user) =>
      user.username.toLowerCase() === currentUser.toLowerCase()
        ? {
            ...user,
            firstName: data.firstName.trim(),
            lastName: trimmedLastName,
            email: trimmedEmail,
            mobile: data.mobile.trim(),
          }
        : user
    )

    saveUsers(updatedUsers)
    set({ users: updatedUsers })

    return { success: true, message: "Account updated successfully." }
  },

  deleteCurrentUser: () => {
    const currentUser = get().currentUser
    if (!currentUser) return

    const updatedUsers = get().users.filter(
      (user) => user.username.toLowerCase() !== currentUser.toLowerCase()
    )

    saveUsers(updatedUsers)
    saveCurrentUser(null)

    set({
      users: updatedUsers,
      currentUser: null,
    })
  },
}))