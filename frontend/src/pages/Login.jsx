import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Star, Shield, Zap, Mail, Lock, User, AlertCircle } from "lucide-react"
import { Button, Input, Loader } from "../components/ui"
import { useAuth } from "../context/AuthContext"
import { useProperty } from "../context/PropertyContext"

export default function Login() {
  const navigate = useNavigate()
  const { login, register, googleLogin } = useAuth()
  const { refreshData } = useProperty()

  const [isSignup, setIsSignup] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

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
          callback: handleGoogleCallback,
          auto_select: false,
        })

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          {
            theme: "outline",
            size: "large",
            width: "384", // standard field width
            shape: "pill",
          }
        )
      }
    }

    return () => {
      // Clean up script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [isSignup]) // Re-initialize button if tab changes

  const handleGoogleCallback = async (response) => {
    setIsLoggingIn(true)
    setErrorMsg("")
    try {
      await googleLogin(response.credential)
      await refreshData() // Sync property context with logged-in user
      navigate("/dashboard")
    } catch (err) {
      console.error(err)
      setErrorMsg("Google authentication failed. Please try again.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setErrorMsg("")
    
    try {
      if (isSignup) {
        await register(email, password, fullName)
      } else {
        await login(email, password)
      }
      await refreshData() // Sync property context with logged-in user
      navigate("/dashboard")
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || "Authentication failed. Please verify credentials.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-4.5rem)] flex items-stretch">
      {isLoggingIn && (
        <Loader fullPage variant="dots" text={isSignup ? "Creating your account..." : "Loading your dashboard workspace..."} />
      )}

      {/* Left: Visual Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-(--color-brand-600) via-(--color-brand-700) to-(--color-brand-900) dark:from-(--color-brand-800) dark:via-black dark:to-(--color-brand-900)">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-(--color-brand-500)/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-(--color-brand-400)/20 blur-[100px]" />

        <div className="relative flex flex-col justify-center px-12 xl:px-16 py-16 z-10">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-semibold text-white/80 uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent-400) animate-pulse" />
              Trusted by 500+ owners
            </div>
            <h2 className="font-heading text-3xl xl:text-4xl font-bold text-white leading-tight">
              Your reviews,<br />decoded by AI
            </h2>
            <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
              Join homestay owners who have transformed their guest feedback into actionable insights.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: <Star size={14} />, text: "93% sentiment accuracy" },
              { icon: <Zap size={14} />, text: "Responses in under 3 seconds" },
              { icon: <Shield size={14} />, text: "End-to-end encrypted data" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 transition-all hover:bg-white/10">
                <span className="text-(--color-accent-400)">{f.icon}</span>
                <span className="text-xs text-white/70 font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial micro */}
          <div className="mt-10 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
            <div className="flex items-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-white/60 leading-relaxed italic">
              "RevLens cut my review response time from 2 hours to 10 minutes. The AI suggestions are incredibly accurate."
            </p>
            <p className="mt-2 text-[10px] font-bold text-white/40">— Ananya G., Goa Homestay Owner</p>
          </div>
        </div>
      </div>

      {/* Right: Authentication Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <svg width="52" height="52" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <filter id="loginLogoShadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.18" />
                  </filter>
                </defs>
                <rect width="36" height="36" rx="9" fill="url(#loginLogoGrad)" filter="url(#loginLogoShadow)" />
                <rect width="36" height="18" rx="9" fill="white" fillOpacity="0.12" />
                <path d="M10 9h9.5a5 5 0 0 1 0 10H14.5l5.5 8H16l-5.5-8.2V9Z" fill="white" fillOpacity="0.95" />
                <circle cx="26.5" cy="25.5" r="3.5" fill="#06b6d4" />
                <circle cx="26.5" cy="25.5" r="1.5" fill="#22d3ee" fillOpacity="0.7" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-bold text-(--color-brand-600) dark:text-white">
              {isSignup ? "Create an account" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-(--color-muted) dark:text-(--color-muted-dark)">
              {isSignup ? "Sign up to manage your properties" : "Sign in to your dashboard"}
            </p>
          </div>

          {/* Error Alert Portal */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 mb-5 text-xs text-red-600 dark:text-red-400 font-medium">
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
                onChange={(e) => setFullName(e.target.value)}
                icon={<User size={16} />}
                fullWidth
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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
              {isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-(--color-muted) dark:text-(--color-muted-dark)">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => {
                setIsSignup(!isSignup)
                setErrorMsg("")
              }}
              className="font-semibold text-(--color-brand-500) dark:text-(--color-brand-400) hover:underline cursor-pointer bg-transparent border-none p-0 inline-block font-sans"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>

          <p className="mt-8 text-center text-[10px] text-(--color-muted)/50 dark:text-(--color-muted-dark)/50 leading-relaxed">
            By continuing, you agree to RevLens AI's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
