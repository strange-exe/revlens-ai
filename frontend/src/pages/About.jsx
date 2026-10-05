import { Link } from "react-router-dom"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import SectionHead from "../components/SectionHead"

// The order backend/app/ai.py actually tries, plus the manual override.
const chain = [
  { source: "AI model", desc: "Our own fine-tuned review classifier, trained and tested on hotel reviews. Used first whenever it's deployed." },
  { source: "LLM", desc: "Google's Gemini, asked for a structured answer. Used when our model isn't available." },
  { source: "Keyword rule", desc: "Simple keyword matching, used only when both AI engines are offline. The app tells you when this happens." },
  { source: "You", desc: "Change any label by hand. Your label always wins and is marked as yours." },
]

const stack = [
  ["Frontend", "React and Vite, styled with Tailwind CSS"],
  ["Backend", "FastAPI with a PostgreSQL database"],
  ["Language model", "Google Gemini API"],
  ["Review classifier", "Fine-tuned DeBERTa, served with ONNX Runtime"],
]

export default function About() {
  return (
    <>
      <section className="pt-32 pb-16 lg:pt-36 lg:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-(--color-brand-600) dark:text-(--color-brand-300)">About RevLens</p>
          <h1 className="mt-3 font-heading text-[2.5rem] leading-[1.05] sm:text-6xl font-bold tracking-[-0.035em] text-(--color-ink) dark:text-white max-w-4xl text-balance">
            For hosts who don&rsquo;t have time to read every review.
          </h1>
          <div className="mt-8 grid md:grid-cols-2 gap-6 md:gap-12 max-w-4xl text-lg leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark)">
            <p>
              A small homestay collects reviews on half a dozen sites. The patterns that matter, like a slow WiFi
              connection or a hard-to-find entrance, are spread across dozens of reviews and easy to miss.
            </p>
            <p>
              RevLens puts those reviews in one place, labels what each guest liked and disliked, and shows which
              problems keep coming up, so you know what to fix first.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 border-t border-(--color-border) dark:border-(--color-border-dark)">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead label="How labels are made" title="Every label says where it came from">
            RevLens tries these sources in order and records which one answered. You see that source next to every label.
          </SectionHead>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {chain.map((c, i) => (
              <li key={c.source} className="border-t-2 border-(--color-ink) dark:border-white pt-5">
                <span className="font-heading text-sm font-bold tabular-nums text-(--color-brand-600) dark:text-(--color-brand-300)">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold text-(--color-ink) dark:text-white">{c.source}</h3>
                <p className="mt-2 text-base leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark)">{c.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-(--color-ink) text-white dark:bg-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-white/70">How we measure it</p>
            <h2 className="mt-2 font-heading text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-tight">Tested on reviews it has never seen</h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-white/75">
            <p>
              Before any model ships, we test it on a frozen set of about 40,000 public hotel reviews that no model is
              trained on. Each candidate is compared with simple baselines, so we know the AI is earning its place.
            </p>
            <p>
              We also write up the reviews each model gets most wrong. A single accuracy number hides those.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">Under the hood</p>
            <h2 className="mt-2 font-heading text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-tight text-(--color-ink) dark:text-white">Open source, start to finish</h2>
            <p className="mt-4 text-base leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark) max-w-md">
              The app, the training pipeline and the evaluation code are all on GitHub. Issues and pull requests are welcome.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link to="/login?mode=signup" className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-(--color-brand-600) text-white font-semibold hover:bg-(--color-brand-700) transition-colors">
                Start free <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="https://github.com/strange-exe/revlens-ai" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-(--color-ink) dark:text-white underline decoration-(--color-border) dark:decoration-white/30 underline-offset-4 hover:decoration-current">
                View the code <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
          <dl className="border-b border-(--color-border) dark:border-(--color-border-dark)">
            {stack.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] sm:grid-cols-[12rem_1fr] gap-4 py-4 border-t border-(--color-border) dark:border-(--color-border-dark)">
                <dt className="text-sm font-semibold text-(--color-ink) dark:text-white">{k}</dt>
                <dd className="text-sm text-(--color-muted) dark:text-(--color-muted-dark)">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  )
}
