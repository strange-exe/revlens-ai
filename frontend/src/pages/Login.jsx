import { Link } from "react-router-dom"

export default function Login() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[--color-brand-500] text-white text-sm font-bold mb-4">R</div>
          <h1 className="font-heading text-2xl font-bold text-[--color-brand-600] dark:text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-[--color-muted] dark:text-[--color-muted-dark]">Sign in to your dashboard</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-[--color-muted] dark:text-[--color-muted-dark] mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[--color-border] dark:border-[--color-border-dark] bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] text-sm text-[--color-brand-600] dark:text-white placeholder:text-[--color-muted]/40 focus:outline-none focus:border-[--color-brand-400] dark:focus:border-[--color-brand-500] focus:ring-1 focus:ring-[--color-brand-400]/20 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[--color-muted] dark:text-[--color-muted-dark] mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[--color-border] dark:border-[--color-border-dark] bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] text-sm text-[--color-brand-600] dark:text-white placeholder:text-[--color-muted]/40 focus:outline-none focus:border-[--color-brand-400] dark:focus:border-[--color-brand-500] focus:ring-1 focus:ring-[--color-brand-400]/20 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[--color-brand-500] text-white text-sm font-semibold hover:bg-[--color-brand-600] transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-[--color-muted] dark:text-[--color-muted-dark]">
          Don't have an account?{" "}
          <Link to="/" className="font-medium text-[--color-brand-500] dark:text-[--color-gold-400] hover:underline">
            Get started
          </Link>
        </p>
      </div>
    </div>
  )
}
