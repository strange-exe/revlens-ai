import { Link } from "react-router-dom"

export default function Login() {
  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold text-center">Sign In</h1>
      <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Access your RevLens AI dashboard
      </p>
      <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        Don't have an account?{" "}
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Get started
        </Link>
      </p>
    </div>
  )
}
