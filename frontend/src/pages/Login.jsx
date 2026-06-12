import { Link } from "react-router-dom"
import { ArrowRight, Star, Shield, Zap } from "lucide-react"

export default function Login() {
  return (
    <div className="min-h-[88vh] flex items-stretch">
      {/* Left: Visual Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-(--color-brand-600) via-(--color-brand-700) to-(--color-brand-900) dark:from-(--color-brand-800) dark:via-black dark:to-(--color-brand-900)">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-(--color-gold-400)/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-(--color-brand-400)/20 blur-[100px]" />

        <div className="relative flex flex-col justify-center px-12 xl:px-16 py-16 z-10">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-semibold text-white/80 uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-(--color-gold-400) animate-pulse" />
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
                <span className="text-(--color-gold-400)">{f.icon}</span>
                <span className="text-xs text-white/70 font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial micro */}
          <div className="mt-10 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
            <div className="flex items-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={10} className="fill-(--color-gold-400) text-(--color-gold-400)" />
              ))}
            </div>
            <p className="text-xs text-white/60 leading-relaxed italic">
              "RevLens cut my review response time from 2 hours to 10 minutes. The AI suggestions are incredibly accurate."
            </p>
            <p className="mt-2 text-[10px] font-bold text-white/40">— Ananya G., Goa Homestay Owner</p>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="deco-ring w-14 h-14 rounded-2xl bg-gradient-to-br from-(--color-brand-400) to-(--color-brand-600) flex items-center justify-center text-white text-lg font-bold shadow-lg mx-auto mb-5">
              R
            </div>
            <h1 className="font-heading text-2xl font-bold text-(--color-brand-600) dark:text-white">Welcome back</h1>
            <p className="mt-1.5 text-sm text-(--color-muted) dark:text-(--color-muted-dark)">Sign in to your dashboard</p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-2.5 mb-6">
            <button className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-elevated-dark) text-sm font-medium text-(--color-brand-600) dark:text-white hover:bg-(--color-surface-muted) dark:hover:bg-(--color-surface-muted-dark) transition-all cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-elevated-dark) text-sm font-medium text-(--color-brand-600) dark:text-white hover:bg-(--color-surface-muted) dark:hover:bg-(--color-surface-muted-dark) transition-all cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-(--color-border) dark:bg-(--color-border-dark)" />
            <span className="text-[10px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark) uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-(--color-border) dark:bg-(--color-border-dark)" />
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark) mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) text-sm text-(--color-brand-600) dark:text-white placeholder:text-(--color-muted)/40 focus:outline-none focus:ring-2 focus:ring-(--color-brand-400)/30 focus:border-(--color-brand-400) transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">Password</label>
                <a href="#" className="text-[10px] font-semibold text-(--color-brand-500) dark:text-(--color-gold-400) hover:underline">Forgot?</a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) text-sm text-(--color-brand-600) dark:text-white placeholder:text-(--color-muted)/40 focus:outline-none focus:ring-2 focus:ring-(--color-brand-400)/30 focus:border-(--color-brand-400) transition-all"
              />
            </div>
            <button
              type="submit"
              className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-(--color-brand-600) dark:bg-(--color-brand-500) text-white text-sm font-bold hover:bg-(--color-brand-700) dark:hover:bg-(--color-brand-600) transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            >
              Sign In
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-(--color-muted) dark:text-(--color-muted-dark)">
            Don't have an account?{" "}
            <Link to="/" className="font-semibold text-(--color-brand-500) dark:text-(--color-gold-400) hover:underline">
              Get started
            </Link>
          </p>

          <p className="mt-8 text-center text-[10px] text-(--color-muted)/50 dark:text-(--color-muted-dark)/50 leading-relaxed">
            By continuing, you agree to RevLens AI's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
