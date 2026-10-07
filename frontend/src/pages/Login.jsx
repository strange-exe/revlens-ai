import React, { useReducer, useEffect } from "react"
import { useEffectEvent } from "../hooks/useEffectEvent"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, Check, Mail, Lock, User, AlertCircle } from "lucide-react"
import ReviewDemo from "../components/ReviewDemo"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Loader from "../components/ui/Loader"
import { useAuth } from "../context/AuthContext"
import { useProperty } from "../context/PropertyContext"

const initialState = {
  isSignup: false,
  fullName: "",
  email: "",
  password: "",
  isLoggingIn: false,
  errorMsg: "",
}

function loginReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value }
    case "TOGGLE_SIGNUP":
      return { ...state, isSignup: !state.isSignup, errorMsg: "" }
    case "START_AUTH":
      return { ...state, isLoggingIn: true, errorMsg: "" }
    case "AUTH_SUCCESS":
      return { ...state, isLoggingIn: false }
    case "AUTH_ERROR":
      return { ...state, isLoggingIn: false, errorMsg: action.payload }
    default:
      return state
  }
}

// "Start free" links open /login?mode=signup. Keyed by mode so following one while already here resets the form.
export default function Login() {
  const [params] = useSearchParams()
  const signup = params.get("mode") === "signup"
  return <LoginForm key={String(signup)} signup={signup} />
}

function LoginForm({ signup }) {
  const navigate = useNavigate()
  const { login, register, googleLogin } = useAuth()
  const { refreshData } = useProperty()

  const [state, dispatch] = useReducer(loginReducer, initialState, (s) => ({ ...s, isSignup: signup }))
  const { isSignup, fullName, email, password, isLoggingIn, errorMsg } = state

  const onGoogleCallback = useEffectEvent(async (response) => {
    dispatch({ type: "START_AUTH" })
    try {
      await googleLogin(response.credential)
      await refreshData() // Sync property context with logged-in user
      dispatch({ type: "AUTH_SUCCESS" })
      navigate("/dashboard")
    } catch (err) {
      console.error(err)
      dispatch({ type: "AUTH_ERROR", payload: "Google authentication failed. Please try again." })
    }
  })

  // Dynamically load Google Identity Services SDK
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
          callback: onGoogleCallback,
          auto_select: false,
        })

        const slot = document.getElementById("google-signin-btn")
        window.google.accounts.id.renderButton(slot, {
          theme: "outline",
          size: "large",
          width: String(Math.min(400, slot.clientWidth)), // fixed 384 overflowed phones
          shape: "rectangular",
        })
      }
    }

    return () => {
      // Clean up script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [isSignup]) // Re-initialize button if tab changes

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    dispatch({ type: "START_AUTH" })
    
    try {
      if (isSignup) {
        await register(email, password, fullName)
      } else {
        await login(email, password)
      }
      await refreshData() // Sync property context with logged-in user
      dispatch({ type: "AUTH_SUCCESS" })
      navigate("/dashboard")
    } catch (err) {
      console.error(err)
      dispatch({ type: "AUTH_ERROR", payload: err.message || "Authentication failed. Please verify credentials." })
    }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-4.5rem)] flex items-stretch">
      {isLoggingIn && (
        <Loader fullPage variant="dots" text={isSignup ? "Creating your account..." : "Loading your dashboard workspace..."} />
      )}

      {/* Left: what you get (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[46%] bg-(--color-ink) dark:bg-white/[0.04] border-r border-transparent dark:border-(--color-border-dark)">
        <div className="flex flex-col justify-center gap-8 px-12 xl:px-16 py-20 max-w-xl">
          <div>
            <p className="text-sm font-semibold text-white/70">RevLens for hosts</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] leading-tight text-white text-balance">
              Every review, marked up for you.
            </h2>
          </div>
          <ReviewDemo compact />
          <ul className="space-y-2.5 text-sm text-white/80">
            {["Every AI label shows where it came from", "Reply drafts you edit before sending", "Answers cite the reviews they use"].map((t) => (
              <li key={t} className="flex items-center gap-2.5"><Check size={16} aria-hidden="true" className="text-emerald-400 shrink-0" />{t}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: Authentication Form */}
      <div className="flex-1 min-w-0 flex items-center justify-center px-4 sm:px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold tracking-[-0.03em] text-(--color-ink) dark:text-white">
              {isSignup ? "Create your free account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-(--color-muted) dark:text-(--color-muted-dark)">
              {isSignup ? "Free. No card needed." : "Sign in to your dashboard"}
            </p>
          </div>

          {/* Error Alert Portal */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 mb-5 text-xs text-red-700 dark:text-red-400 font-medium">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Login Container */}
          <div className="flex justify-center mb-6">
            <div id="google-signin-btn" className="w-full select-none" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-(--color-border) dark:bg-(--color-border-dark)" />
            <span className="text-[10px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark) uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-(--color-border) dark:bg-(--color-border-dark)" />
          </div>

          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            {isSignup && (
              <Input
                label="Full Name"
                type="text"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "fullName", value: e.target.value })}
                icon={<User size={16} />}
                fullWidth
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "email", value: e.target.value })}
              icon={<Mail size={16} />}
              fullWidth
              required
            />
            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "password", value: e.target.value })}
                icon={<Lock size={16} />}
                fullWidth
                required
              />
            </div>
            
            <Button
              type="submit"
              variant="primary"
              fullWidth
              icon={<ArrowRight size={15} />}
              iconPosition="right"
              className="py-3.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-6"
            >
              {isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-(--color-muted) dark:text-(--color-muted-dark)">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_SIGNUP" })}
              className="font-semibold text-(--color-brand-500) dark:text-(--color-brand-400) hover:underline cursor-pointer bg-transparent border-none p-0 inline-block font-sans"
            >
              {isSignup ? "Sign in" : "Start free"}
            </button>
          </p>

          <p className="mt-8 text-center text-xs text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed">
            By continuing, you agree to RevLens AI's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
