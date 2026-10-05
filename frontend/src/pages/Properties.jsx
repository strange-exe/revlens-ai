import { useState, useMemo } from "react"
import { useDismissibleError } from "../hooks/useDismissibleError"
import { useProperty } from "../context/PropertyContext"
import PageSkeleton from "../components/ui/Skeleton"
import { useNavigate } from "react-router-dom"
import Select from "../components/ui/Select"
import Toast from "../components/ui/Toast"
import { Building, Search, MapPin, Star, Plus, Check, ArrowRight } from "lucide-react"

// Only the host's own properties, with numbers computed from their reviews (spam excluded).
// No seeded competitors, invented prices or default ratings: if there's no data, the page says so.
const field = "w-full text-sm px-3.5 py-2.5 rounded-lg border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-muted-dark) text-(--color-ink) dark:text-white focus:outline-none focus:ring-2 focus:ring-(--color-brand-500)/20 focus:border-(--color-brand-500) transition-colors"
const label = "text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark)"

export default function Properties() {
  const { properties, addProperty, selectedPropertyId, setSelectedPropertyId, reviews, loading, error } = useProperty()
  const navigate = useNavigate()
  const [viewState, setViewState] = useState({
    searchTerm: "",
    locationFilter: "all",
    showAddForm: false,
    newPropName: "",
    newPropLocation: "",
    newPropPrice: "",
    addSuccess: false,
    toastMessage: null,
  })
  const { searchTerm, locationFilter, showAddForm, newPropName, newPropLocation, newPropPrice, addSuccess, toastMessage } = viewState
  const set = (patch) => setViewState((prev) => ({ ...prev, ...patch }))

  // Load errors come from the context; add-property results from local state. Show whichever is present.
  const [loadError, dismissLoadError] = useDismissibleError(error)
  const toast = toastMessage ?? (loadError && { text: loadError, type: "error" })

  const propertiesWithStats = useMemo(() => properties.map((p) => {
    const own = reviews.filter((r) => r.propertyId === p.id && !r.isSpam)
    return {
      ...p,
      reviewsCount: own.length,
      rating: own.length ? (own.reduce((sum, r) => sum + r.rating, 0) / own.length).toFixed(1) : null,
    }
  }), [properties, reviews])

  const locations = useMemo(() => [...new Set(properties.map((p) => p.location))].sort(), [properties])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return propertiesWithStats.filter((p) =>
      (locationFilter === "all" || p.location.toLowerCase() === locationFilter.toLowerCase()) &&
      (!q || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)))
  }, [propertiesWithStats, locationFilter, searchTerm])

  const handleAddProperty = async (e) => {
    e.preventDefault()
    if (!newPropName || !newPropLocation) return
    const price = parseInt(newPropPrice, 10)
    try {
      await addProperty({
        name: newPropName,
        location: newPropLocation,
        // Only store a price the host actually entered
        ...(price > 0 ? { price: `₹${price.toLocaleString("en-IN")}/night` } : {}),
      })
      set({ addSuccess: true, newPropName: "", newPropLocation: "", newPropPrice: "", toastMessage: { text: `Added ${newPropName}.`, type: "success" } })
      setTimeout(() => set({ addSuccess: false, showAddForm: false }), 2000)
    } catch (err) {
      set({ toastMessage: { text: `Couldn't add the property: ${err.message || err}`, type: "error" } })
    }
  }

  if (loading) return <PageSkeleton label="Loading properties" variant="list" />

  return (
    <div className="space-y-6 animate-slide-up-sm">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
          <Toast message={toast.text} type={toast.type} onClose={() => (toastMessage ? set({ toastMessage: null }) : dismissLoadError())} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-(--color-ink) dark:text-white">Properties</h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">
            Your properties, with ratings from the reviews you&rsquo;ve added (spam excluded).
          </p>
        </div>
        <button
          type="button"
          aria-expanded={showAddForm}
          aria-controls="add-property-form"
          onClick={() => set({ showAddForm: !showAddForm })}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-(--color-brand-600) hover:bg-(--color-brand-700) text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          <Plus size={16} aria-hidden="true" />
          Add property
        </button>
      </div>

      {showAddForm && (
        <div id="add-property-form" className="widget-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-(--color-ink) dark:text-white mb-4">Add a property</h2>
          {addSuccess ? (
            <p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-3.5 rounded-lg text-sm font-semibold">
              <Check size={16} aria-hidden="true" /> Property added. It&rsquo;s now in the property selector.
            </p>
          ) : (
            <form onSubmit={handleAddProperty} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_12rem_auto] gap-4 items-end">
              <div className="space-y-1">
                <label htmlFor="new-property-name" className={label}>Property name</label>
                <input id="new-property-name" type="text" required placeholder="e.g. Whispering Palms Retreat" value={newPropName}
                  onChange={(e) => set({ newPropName: e.target.value })} className={field} />
              </div>
              <div className="space-y-1">
                <label htmlFor="new-property-location" className={label}>Location (city or region)</label>
                <input id="new-property-location" type="text" required placeholder="e.g. Goa" value={newPropLocation}
                  onChange={(e) => set({ newPropLocation: e.target.value })} className={field} />
              </div>
              <div className="space-y-1">
                <label htmlFor="new-property-price" className={label}>Nightly price, ₹ (optional)</label>
                <input id="new-property-price" type="number" min="0" inputMode="numeric" placeholder="e.g. 5000" value={newPropPrice}
                  onChange={(e) => set({ newPropPrice: e.target.value })} className={field} />
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-(--color-brand-600) hover:bg-(--color-brand-700) text-white font-semibold text-sm transition-colors cursor-pointer">
                Add
              </button>
            </form>
          )}
        </div>
      )}

      {properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_16rem] gap-3">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-muted) dark:text-(--color-muted-dark)" size={16} />
            <input type="search" aria-label="Search properties" placeholder="Search by name or location" value={searchTerm}
              onChange={(e) => set({ searchTerm: e.target.value })} className={`${field} pl-10`} />
          </div>
          <Select
            icon={MapPin}
            ariaLabel="Filter by location"
            value={locationFilter}
            onChange={(val) => set({ locationFilter: val })}
            options={[{ value: "all", label: "All locations" }, ...locations.map((l) => ({ value: l, label: l }))]}
            className="w-full"
          />
        </div>
      )}

      {properties.length === 0 ? (
        <div className="widget-card rounded-2xl p-10 text-center">
          <Building aria-hidden="true" className="mx-auto text-(--color-muted) dark:text-(--color-muted-dark)" size={32} />
          <p className="mt-3 text-sm font-semibold text-(--color-ink) dark:text-white">No properties yet</p>
          <p className="mt-1 text-sm text-(--color-muted) dark:text-(--color-muted-dark)">Add your first property, then add the reviews it received.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="widget-card rounded-2xl p-8 text-center">
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark)">No properties match your search.</p>
          <button type="button" onClick={() => set({ searchTerm: "", locationFilter: "all" })}
            className="mt-2 text-sm font-semibold text-(--color-brand-600) dark:text-(--color-brand-300) hover:underline cursor-pointer">
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isActive = selectedPropertyId === String(p.id)
            return (
              <li key={p.id} className={`widget-card rounded-2xl p-5 flex flex-col border ${isActive ? "border-(--color-brand-500)" : "border-(--color-border) dark:border-(--color-border-dark)"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading font-bold text-base text-(--color-ink) dark:text-white truncate">{p.name}</h2>
                    <p className="flex items-center gap-1 mt-0.5 text-sm text-(--color-muted) dark:text-(--color-muted-dark)">
                      <MapPin size={13} aria-hidden="true" /> {p.location}
                    </p>
                  </div>
                  {isActive && <span className="shrink-0 text-xs font-semibold text-(--color-brand-600) dark:text-(--color-brand-300)">Selected</span>}
                </div>

                <dl className="grid grid-cols-2 gap-3 my-4 py-3 border-y border-(--color-border) dark:border-(--color-border-dark)">
                  <div>
                    <dt className="text-xs text-(--color-muted) dark:text-(--color-muted-dark)">Rating</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-(--color-ink) dark:text-white">
                      {p.rating ? (
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Star size={13} aria-hidden="true" className="fill-amber-400 text-amber-400" />{p.rating}
                          <span className="font-normal text-(--color-muted) dark:text-(--color-muted-dark)">· {p.reviewsCount} {p.reviewsCount === 1 ? "review" : "reviews"}</span>
                        </span>
                      ) : <span className="font-normal text-(--color-muted) dark:text-(--color-muted-dark)">No reviews yet</span>}
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-xs text-(--color-muted) dark:text-(--color-muted-dark)">Nightly price</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-(--color-ink) dark:text-white">
                      {p.price || <span className="font-normal text-(--color-muted) dark:text-(--color-muted-dark)">Not set</span>}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedPropertyId(isActive ? "all" : String(p.id))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${isActive
                      ? "bg-(--color-brand-600) text-white hover:bg-(--color-brand-700)"
                      : "border border-(--color-border) dark:border-(--color-border-dark) bg-(--color-surface-elevated) dark:bg-white/5 text-(--color-ink) dark:text-white hover:border-(--color-brand-500)"}`}
                  >
                    {isActive ? "Show all properties" : "Focus on this property"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedPropertyId(String(p.id)); navigate("/dashboard/reviews") }}
                    aria-label={`Open reviews for ${p.name}`}
                    title="Open reviews"
                    className="p-2 rounded-lg border border-(--color-border) dark:border-(--color-border-dark) bg-(--color-surface-elevated) dark:bg-white/5 text-(--color-ink) dark:text-white hover:border-(--color-brand-500) transition-colors cursor-pointer"
                  >
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
