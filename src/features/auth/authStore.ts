import { create } from "zustand"
import type { User } from "@supabase/supabase-js"
import { supabase } from "../../lib/supabase"

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

type AuthResult = {
  success: boolean
  message: string
}

type AuthStore = {
  currentUser: User | null
  isAuthReady: boolean
  initializeAuth: () => Promise<void>
  signup: (data: SignupInput) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  updateCurrentUser: (
    data: UpdateCurrentUserInput
  ) => Promise<AuthResult>
  deleteCurrentUser: () => Promise<void>
}

let authSubscriptionInitialized = false

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  isAuthReady: false,

  initializeAuth: async () => {
    if (!authSubscriptionInitialized) {
      authSubscriptionInitialized = true

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          currentUser: session?.user ?? null,
          isAuthReady: true,
        })
      })
    }

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      set({
        currentUser: null,
        isAuthReady: true,
      })
      return
    }

    set({
      currentUser: data.session?.user ?? null,
      isAuthReady: true,
    })
  },

  signup: async (data) => {
    const email = data.email.trim().toLowerCase()
    const password = data.password.trim()
    const username = data.username.trim()

    if (!data.lastName.trim() || !email || !password || !username) {
      return {
        success: false,
        message: "Please complete all required fields.",
      }
    }

    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email,
        password,
      }
    )

    if (signupError) {
      return {
        success: false,
        message: signupError.message,
      }
    }

    const user = signupData.user
    const session = signupData.session

    if (!user) {
      return {
        success: false,
        message: "Account could not be created.",
      }
    }

    if (!session) {
      return {
        success: false,
        message:
          "Signup succeeded, but no active session was created. Check your Supabase email confirmation setting.",
      }
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      email,
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      username,
      birth_month: data.birthMonth.trim(),
      birth_day: data.birthDay.trim(),
      birth_year: data.birthYear.trim(),
      mobile: data.mobile.trim(),
    })

    if (profileError) {
      return {
        success: false,
        message: profileError.message,
      }
    }

    set({
      currentUser: user,
      isAuthReady: true,
    })

    return {
      success: true,
      message: "Account created successfully.",
    }
  },

  login: async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    })

    if (error || !data.user) {
      return {
        success: false,
        message: error?.message || "Invalid email or password.",
      }
    }

    set({
      currentUser: data.user,
      isAuthReady: true,
    })

    return {
      success: true,
      message: "Login successful.",
    }
  },

  logout: async () => {
    await supabase.auth.signOut()

    set({
      currentUser: null,
      isAuthReady: true,
    })
  },

  updateCurrentUser: async (data) => {
    const currentUser = get().currentUser

    if (!currentUser) {
      return {
        success: false,
        message: "No current user found.",
      }
    }

    const trimmedLastName = data.lastName.trim()
    const trimmedEmail = data.email.trim().toLowerCase()

    if (!trimmedLastName || !trimmedEmail) {
      return {
        success: false,
        message: "Last name and email are required.",
      }
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      email: trimmedEmail,
    })

    if (authUpdateError) {
      return {
        success: false,
        message: authUpdateError.message,
      }
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        first_name: data.firstName.trim(),
        last_name: trimmedLastName,
        email: trimmedEmail,
        mobile: data.mobile.trim(),
      })
      .eq("id", currentUser.id)

    if (profileUpdateError) {
      return {
        success: false,
        message: profileUpdateError.message,
      }
    }

    return {
      success: true,
      message: "Account updated successfully.",
    }
  },

  deleteCurrentUser: async () => {
    const currentUser = get().currentUser
    if (!currentUser) return

    await supabase.from("profiles").delete().eq("id", currentUser.id)
    await supabase.auth.signOut()

    set({
      currentUser: null,
      isAuthReady: true,
    })
  },
}))