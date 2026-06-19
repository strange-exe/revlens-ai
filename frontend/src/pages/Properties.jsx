import { useState, useMemo } from "react"
import { useProperty } from "../context/PropertyContext"
import { useNavigate } from "react-router-dom"
import Modal from "../components/ui/Modal"
import { Select } from "../components/ui"

import { 
  Building, 
  Search, 
  MapPin, 
  Star, 
  Plus, 
  Map, 
  Navigation, 
  TrendingUp, 
  Coins, 
  Check, 
  ArrowRight,
  Sparkles
} from "lucide-react"

export default function Properties() {
  const { 
    properties, 
    addProperty, 
    nearbyProperties, 
    selectedPropertyId, 
    setSelectedPropertyId,
    reviews 
  } = useProperty()
  
  const navigate = useNavigate()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all") // "all" | "mine" | "nearby"
  
  // Form state for adding a property
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPropName, setNewPropName] = useState("")
  const [newPropLocation, setNewPropLocation] = useState("")
  const [newPropPrice, setNewPropPrice] = useState("5000")
  const [addSuccess, setAddSuccess] = useState(false)

  // Comparison State
  const [compareMode, setCompareMode] = useState(false)
  const [compareProp1, setCompareProp1] = useState(null)
  const [compareProp2, setCompareProp2] = useState(null)

  // Calculate dynamic stats for user's own properties based on actual reviews
  const myPropertiesWithStats = useMemo(() => {
    // Mock base prices for existing user properties
    const basePrices = {
      1: "₹7,500/night",
      2: "₹6,000/night",
      3: "₹5,200/night"
    }

    return properties.map(p => {
      // Filter out spam reviews from rating calculation
      const propReviews = reviews.filter(r => r.propertyId === p.id && !r.isSpam && !r.isUnflagged === false)
      const reviewsCount = propReviews.length
      const avgRating = reviewsCount > 0 
        ? parseFloat((propReviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1))
        : 4.5 // Default fallback

      return {
        ...p,
        rating: avgRating,
        price: basePrices[p.id] || `₹${parseInt(newPropPrice).toLocaleString('en-IN')}/night`,
        reviewsCount,
        isUserProperty: true
      }
    })
  }, [properties, reviews, newPropPrice])

  // Combined list of user properties and nearby/competitor properties
  const allPropertiesCombined = useMemo(() => {
    const formattedNearby = nearbyProperties.map(p => ({
      ...p,
      isUserProperty: false
    }))
    return [...myPropertiesWithStats, ...formattedNearby]
  }, [myPropertiesWithStats, nearbyProperties])

  // Get list of unique locations for dropdown filter
  const locations = useMemo(() => {
    const locs = new Set(allPropertiesCombined.map(p => p.location))
    return ["all", ...Array.from(locs)]
  }, [allPropertiesCombined])

  // Filter properties based on search term, location filter, and active tab selector
  const filteredProperties = useMemo(() => {
    return allPropertiesCombined.filter(p => {
      // 1. Tab filtering
      if (activeTab === "mine" && !p.isUserProperty) return false
      if (activeTab === "nearby" && p.isUserProperty) return false

      // 2. Location filtering
      if (locationFilter !== "all" && p.location.toLowerCase() !== locationFilter.toLowerCase()) return false

      // 3. Name/Search term filtering
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.location.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [allPropertiesCombined, activeTab, locationFilter, searchTerm])

  // Count highlights for badges
  const mineCount = useMemo(() => myPropertiesWithStats.length, [myPropertiesWithStats])
  const nearbyCount = useMemo(() => nearbyProperties.length, [nearbyProperties])

  const handleAddProperty = (e) => {
    e.preventDefault()
    if (!newPropName || !newPropLocation) return

    addProperty({
      name: newPropName,
      location: newPropLocation
    })

    setAddSuccess(true)
    setNewPropName("")
    setNewPropLocation("")
    
    setTimeout(() => {
      setAddSuccess(false)
      setShowAddForm(false)
    }, 2000)
  }

  const handleSelectProperty = (id) => {
    setSelectedPropertyId(id)
  }

  return (
    <div className="space-y-6 animate-slide-up-sm">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient-silver dark:text-white flex items-center gap-2">
            <Building className="text-(--color-brand-500) dark:text-(--color-brand-400)" size={24} />
            Property Search & Discovery
          </h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">
            Search, view and manage your homestay properties, and discover nearby market competitors.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-(--color-brand-500) hover:bg-(--color-brand-600) text-white font-semibold text-xs shadow-md transition-all cursor-pointer min-h-[40px]"
        >
          <Plus size={16} />
          Register Property
        </button>
      </div>

      {/* Register Property Form (Inline Expandable Panel) */}
      {showAddForm && (
        <div className="widget-card rounded-2xl p-5 border border-(--color-brand-500)/20 dark:border-(--color-brand-500)/30 bg-(--color-surface-elevated)/90 dark:bg-(--color-surface-elevated-dark)/90 backdrop-blur-xl animate-scale-in">
          <h3 className="text-sm font-bold text-gradient-silver dark:text-white mb-4 flex items-center gap-2">
            <Building size={16} className="text-(--color-brand-500)" />
            Register a New Homestay Property
          </h3>
          
          {addSuccess ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-xs font-semibold">
              <Check size={16} />
              Property registered successfully! Syncing to dashboard selector...
            </div>
          ) : (
            <form onSubmit={handleAddProperty} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-bold text-(--color-muted) dark:text-(--color-muted-dark)">Property Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Whispering Palms Retreat"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-muted-dark) text-(--color-brand-600) dark:text-white focus:outline-none focus:ring-2 focus:ring-(--color-brand-500)/20 focus:border-(--color-brand-500) transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-(--color-muted) dark:text-(--color-muted-dark)">Location (City/Region)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa"
                  value={newPropLocation}
                  onChange={(e) => setNewPropLocation(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-muted-dark) text-(--color-brand-600) dark:text-white focus:outline-none focus:ring-2 focus:ring-(--color-brand-500)/20 focus:border-(--color-brand-500) transition-all"
                />
              </div>

              <div className="flex gap-2">
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-bold text-(--color-muted) dark:text-(--color-muted-dark)">Est. Price / Night</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={newPropPrice}
                    onChange={(e) => setNewPropPrice(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-muted-dark) text-(--color-brand-600) dark:text-white focus:outline-none focus:ring-2 focus:ring-(--color-brand-500)/20 focus:border-(--color-brand-500) transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-(--color-brand-500) hover:bg-(--color-brand-600) text-white font-semibold text-xs shadow-md transition-all cursor-pointer min-h-[40px]"
                >
                  Register
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Filter panel (Search, Location filters and Tab selectors) */}
      <div className="widget-card rounded-2xl p-4 space-y-4 relative z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search inputs */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-muted) dark:text-(--color-muted-dark)" size={16} />
              <input
                type="text"
                placeholder="Search by property name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-white/5 text-(--color-brand-600) dark:text-white focus:outline-none focus:ring-2 focus:ring-(--color-brand-500)/10 focus:border-(--color-brand-500) transition-all"
              />
            </div>

            <Select
              icon={MapPin}
              value={locationFilter}
              onChange={setLocationFilter}
              options={[
                { value: "all", label: "All Locations" },
                ...locations.filter(l => l !== "all").map(l => ({ value: l, label: l }))
              ]}
              className="w-full"
            />
          </div>

          {/* Tab buttons */}
          <div className="flex rounded-xl bg-(--color-surface-muted) dark:bg-white/5 p-1 border border-(--color-border) dark:border-white/5 self-start md:self-center">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === "all" ? "bg-white dark:bg-(--color-surface-elevated-dark) text-(--color-brand-600) dark:text-white shadow-sm" : "text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500) dark:hover:text-white"}`}
            >
              All Properties
            </button>
            <button
              onClick={() => setActiveTab("mine")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "mine" ? "bg-white dark:bg-(--color-surface-elevated-dark) text-(--color-brand-600) dark:text-white shadow-sm" : "text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500) dark:hover:text-white"}`}
            >
              My Portfolio
              <span className={`inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full ${activeTab === "mine" ? "bg-(--color-brand-500) text-white" : "bg-black/10 dark:bg-white/10"}`}>{mineCount}</span>
            </button>
            <button
              onClick={() => setActiveTab("nearby")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "nearby" ? "bg-white dark:bg-(--color-surface-elevated-dark) text-(--color-brand-600) dark:text-white shadow-sm" : "text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500) dark:hover:text-white"}`}
            >
              Nearby Competitors
              <span className={`inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full ${activeTab === "nearby" ? "bg-(--color-accent-500) text-black font-bold" : "bg-black/10 dark:bg-white/10"}`}>{nearbyCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Cards, Right Column Mock Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - Properties Grid */}
        <div className="lg:col-span-2 space-y-4">
          {filteredProperties.length === 0 ? (
            <div className="widget-card rounded-2xl p-8 text-center space-y-3">
              <Building className="mx-auto text-(--color-muted) dark:text-(--color-muted-dark)" size={32} />
              <p className="text-xs font-medium text-(--color-muted) dark:text-(--color-muted-dark)">
                No properties match the search or location criteria.
              </p>
              <button 
                onClick={() => { setSearchTerm(""); setLocationFilter("all"); setActiveTab("all"); }}
                className="text-xs font-bold text-(--color-brand-500) hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProperties.map((p) => {
                const isSelected = selectedPropertyId === p.id.toString() || (selectedPropertyId === "all" && p.id === 1 && p.isUserProperty)
                
                return (
                  <div
                    key={`${p.isUserProperty ? 'user' : 'nearby'}-${p.id}`}
                    className={`widget-card rounded-2xl p-5 border flex flex-col justify-between transition-all relative ${
                      isSelected 
                        ? p.isUserProperty 
                          ? "border-(--color-brand-500) shadow-[0_0_15px_rgba(139,92,246,0.15)] bg-gradient-to-b from-(--color-brand-500)/5 to-transparent"
                          : "border-(--color-accent-500) shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-gradient-to-b from-(--color-accent-500)/5 to-transparent"
                        : "border-(--color-border) dark:border-(--color-border-dark)"
                    }`}
                  >
                    {/* Upper Meta */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          p.isUserProperty 
                            ? "bg-(--color-brand-500)/10 border-(--color-brand-500)/20 text-(--color-brand-600) dark:text-(--color-brand-300)" 
                            : "bg-(--color-accent-500)/10 border-(--color-accent-500)/20 text-(--color-accent-600) dark:text-(--color-accent-400)"
                        }`}>
                          {p.isUserProperty ? "My Portfolio" : "Nearby Competitor"}
                        </span>
                        
                        {!p.isUserProperty && p.distance && (
                          <span className="text-[10px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark) flex items-center gap-0.5">
                            <Navigation size={10} className="rotate-45" />
                            {p.distance}
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading font-bold text-sm text-(--color-brand-600) dark:text-white mt-1 group-hover:text-(--color-brand-500)">
                        {p.name}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-[11px] text-(--color-muted) dark:text-(--color-muted-dark)">
                        <MapPin size={12} className="text-(--color-muted) dark:text-(--color-muted-dark)/70" />
                        <span>{p.location}</span>
                      </div>
                    </div>

                    {/* Stats & Price */}
                    <div className="grid grid-cols-2 gap-2 my-4 py-3 border-y border-(--color-border)/40 dark:border-(--color-border-dark)/40">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) font-medium">Avg Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="fill-amber-400 stroke-amber-400" size={12} />
                          <span className="text-xs font-bold text-(--color-brand-600) dark:text-white">{p.rating}</span>
                          <span className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">({p.reviewsCount})</span>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) font-medium">Est. Price</span>
                        <div className="text-xs font-bold text-(--color-brand-600) dark:text-white flex items-center justify-end gap-0.5">
                          <Coins size={12} className="text-amber-500/80" />
                          <span>{p.price}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex items-center gap-2 mt-1">
                      {p.isUserProperty ? (
                        <>
                          <button
                            onClick={() => handleSelectProperty(p.id.toString())}
                            className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-(--color-brand-500) text-white shadow-sm"
                                : "bg-(--color-surface-muted) dark:bg-white/5 text-(--color-brand-600) dark:text-white hover:bg-(--color-brand-100) dark:hover:bg-white/10"
                            }`}
                          >
                            {isSelected ? "Active View" : "Select Property"}
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedPropertyId(p.id.toString());
                              navigate("/dashboard/reviews");
                            }}
                            title="Analyze feedback reviews"
                            className="p-2 rounded-xl bg-(--color-surface-muted) dark:bg-white/5 text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500) dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            const matchingMyProp = myPropertiesWithStats.find(myP => myP.location.toLowerCase() === p.location.toLowerCase()) || myPropertiesWithStats[0]
                            setCompareProp1(matchingMyProp)
                            setCompareProp2(p)
                            setCompareMode(true)
                          }}
                          className="w-full text-center py-2 rounded-xl text-xs font-semibold bg-white/5 dark:bg-white/5 border border-(--color-accent-500)/25 hover:border-(--color-accent-500)/60 text-(--color-accent-600) dark:text-(--color-accent-400) hover:bg-(--color-accent-500)/10 transition-all cursor-pointer"
                        >
                          Compare Analytics
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column - Interactive Map Mockup */}
        <div className="space-y-6">
          <div className="widget-card rounded-2xl p-5 border border-(--color-border) dark:border-(--color-border-dark) bg-gradient-to-b from-transparent to-(--color-surface-muted)/20 dark:to-white/[0.01]">
            <div className="flex items-center justify-between pb-3 border-b border-(--color-border)/40 dark:border-white/5 mb-4">
              <h3 className="text-xs font-bold text-gradient-silver dark:text-white flex items-center gap-1.5">
                <Map size={14} className="text-(--color-brand-500)" />
                Live Discovery HUD Map
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--color-brand-400) opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-(--color-brand-500)"></span>
              </span>
            </div>

            {/* Stylized Visual Mock Map Container */}
            <div className="h-48 rounded-xl bg-black relative overflow-hidden border border-white/5 flex items-center justify-center select-none shadow-inner">
              {/* Map grid lines */}
              <div className="absolute inset-0 bg-zinc-950 opacity-90 grid-pattern"></div>
              
              {/* Radar sweeps */}
              <div className="absolute inset-0 bg-gradient-conic from-(--color-brand-500)/5 via-transparent to-transparent animate-border-dance opacity-25"></div>

              {/* Map topography ring circles */}
              <div className="absolute w-36 h-36 border border-white/5 rounded-full"></div>
              <div className="absolute w-24 h-24 border border-white/5 rounded-full"></div>
              <div className="absolute w-12 h-12 border border-white/10 rounded-full"></div>
              
              {/* Dot elements representing selected property highlights */}
              {/* Goa location dots */}
              {(locationFilter === "all" || locationFilter.toLowerCase() === "goa") && (
                <>
                  <div className="absolute top-1/3 left-1/4 flex flex-col items-center">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-(--color-brand-400) opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-(--color-brand-500) shadow-sm shadow-(--color-brand-500)/80"></span>
                    </span>
                    <span className="text-[8px] text-white/70 bg-black/60 px-1 py-0.5 rounded border border-white/10 mt-1 font-mono">Sunset Villa (Goa)</span>
                  </div>
                  <div className="absolute top-1/4 left-1/2 flex flex-col items-center">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-(--color-accent-500) shadow-sm shadow-(--color-accent-500)/80"></span>
                    </span>
                    <span className="text-[8px] text-white/50 bg-black/60 px-1 py-0.5 rounded border border-white/5 mt-1 font-mono">Ocean Crest</span>
                  </div>
                </>
              )}

              {/* Manali location dots */}
              {(locationFilter === "all" || locationFilter.toLowerCase() === "manali") && (
                <>
                  <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-(--color-brand-400) opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-(--color-brand-500) shadow-sm shadow-(--color-brand-500)/80"></span>
                    </span>
                    <span className="text-[8px] text-white/70 bg-black/60 px-1 py-0.5 rounded border border-white/10 mt-1 font-mono">Mountain Retreat</span>
                  </div>
                  <div className="absolute bottom-1/4 right-1/2 flex flex-col items-center">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-(--color-accent-500) shadow-sm shadow-(--color-accent-500)/80"></span>
                    </span>
                    <span className="text-[8px] text-white/50 bg-black/60 px-1 py-0.5 rounded border border-white/5 mt-1 font-mono">Pine Lodge</span>
                  </div>
                </>
              )}

              {/* HUD interface overlays */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[9px] text-(--color-muted-dark) bg-black/50 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5 font-mono">
                <Navigation size={8} className="text-(--color-brand-400)" />
                <span>GPS LOCK: ACTIVE</span>
              </div>

              <div className="absolute top-2 right-2 text-[9px] text-right font-mono text-(--color-muted-dark) bg-black/50 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5">
                {filteredProperties.length} Properties
              </div>
            </div>

            {/* Region Market Comparison Statistics */}
            <div className="mt-4 space-y-3">
              <h4 className="text-[11px] font-bold text-gradient-silver dark:text-white uppercase tracking-wider">
                Region Market Pulse
              </h4>
              
              <div className="space-y-2">
                {/* Pricing comparison */}
                <div className="p-3 bg-white/40 dark:bg-white/5 rounded-xl border border-(--color-border) dark:border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Coins size={14} className="text-amber-500/80" />
                    <span className="text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">Market Avg Pricing</span>
                  </div>
                  <span className="text-xs font-bold text-(--color-brand-600) dark:text-white">
                    {locationFilter === "all" ? "₹5,200/night" : locationFilter.toLowerCase() === "goa" ? "₹5,225/night" : locationFilter.toLowerCase() === "manali" ? "₹5,750/night" : "₹4,900/night"}
                  </span>
                </div>

                {/* Rating average comparison */}
                <div className="p-3 bg-white/40 dark:bg-white/5 rounded-xl border border-(--color-border) dark:border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-amber-400" />
                    <span className="text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">Market Rating Avg</span>
                  </div>
                  <span className="text-xs font-bold text-(--color-brand-600) dark:text-white">
                    4.4 ⭐
                  </span>
                </div>

                {/* Sentiment score pulse */}
                <div className="p-3 bg-white/40 dark:bg-white/5 rounded-xl border border-(--color-border) dark:border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-(--color-brand-500)" />
                    <span className="text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">Market Sentiment</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    84% Positive
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tip Widget Card */}
          <div className="widget-card rounded-2xl p-4 bg-gradient-to-br from-(--color-brand-500)/10 via-transparent to-transparent border border-(--color-brand-500)/20 dark:border-(--color-brand-500)/10">
            <h4 className="text-xs font-bold text-gradient-silver dark:text-white flex items-center gap-1">
              <Sparkles size={12} className="text-(--color-brand-400)" />
              Market Competitor Insights
            </h4>
            <p className="text-[11px] text-(--color-muted) dark:text-(--color-muted-dark) mt-1.5 leading-relaxed">
              Use competitor discovery to compare pricing points and analyze sentiment spikes within {locationFilter === "all" ? "Goa, Manali, and Nainital" : locationFilter} regions. 
              Properties with higher ratings and lower price-tags drive higher customer occupancy rates.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      <Modal
        isOpen={compareMode}
        onClose={() => setCompareMode(false)}
        title="Side-by-Side Comparison"
        size="lg"
      >
        {compareProp1 && compareProp2 && (
          <div className="grid grid-cols-2 gap-6 relative">
            {/* VS Badge */}
            <div className="absolute left-1/2 top-[40%] -translate-x-1/2 w-8 h-8 rounded-full bg-(--color-surface) dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) flex items-center justify-center text-[10px] font-bold text-(--color-muted) dark:text-(--color-muted-dark) z-10 shadow-lg">
              VS
            </div>

            {/* Prop 1 */}
            <div className="space-y-4 p-5 rounded-2xl bg-(--color-brand-500)/5 border border-(--color-brand-500)/20">
              <div>
                <span className="text-[10px] font-bold text-(--color-brand-500) uppercase tracking-wider">Your Property</span>
                <h4 className="font-heading font-bold text-lg text-(--color-brand-600) dark:text-white mt-1">{compareProp1.name}</h4>
                <div className="flex items-center gap-1 text-[11px] text-(--color-muted) dark:text-(--color-muted-dark) mt-1">
                  <MapPin size={12} /> {compareProp1.location}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-(--color-border)/50 dark:border-(--color-border-dark)/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-(--color-muted) dark:text-(--color-muted-dark)">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-sm text-(--color-brand-600) dark:text-white">{compareProp1.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-(--color-muted) dark:text-(--color-muted-dark)">Est. Price</span>
                  <div className="flex items-center gap-1">
                    <Coins size={14} className="text-amber-500" />
                    <span className="font-bold text-sm text-(--color-brand-600) dark:text-white">{compareProp1.price}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-(--color-muted) dark:text-(--color-muted-dark)">Total Reviews</span>
                  <span className="font-bold text-sm text-(--color-brand-600) dark:text-white">{compareProp1.reviewsCount}</span>
                </div>
              </div>
            </div>

            {/* Prop 2 */}
            <div className="space-y-4 p-5 rounded-2xl bg-(--color-accent-500)/5 border border-(--color-accent-500)/20">
              <div>
                <span className="text-[10px] font-bold text-(--color-accent-500) uppercase tracking-wider">Competitor</span>
                <h4 className="font-heading font-bold text-lg text-(--color-brand-600) dark:text-white mt-1">{compareProp2.name}</h4>
                <div className="flex items-center gap-1 text-[11px] text-(--color-muted) dark:text-(--color-muted-dark) mt-1">
                  <MapPin size={12} /> {compareProp2.location}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-(--color-border)/50 dark:border-(--color-border-dark)/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-(--color-muted) dark:text-(--color-muted-dark)">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-sm text-(--color-brand-600) dark:text-white">{compareProp2.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-(--color-muted) dark:text-(--color-muted-dark)">Est. Price</span>
                  <div className="flex items-center gap-1">
                    <Coins size={14} className="text-amber-500" />
                    <span className="font-bold text-sm text-(--color-brand-600) dark:text-white">{compareProp2.price}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-(--color-muted) dark:text-(--color-muted-dark)">Total Reviews</span>
                  <span className="font-bold text-sm text-(--color-brand-600) dark:text-white">{compareProp2.reviewsCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
