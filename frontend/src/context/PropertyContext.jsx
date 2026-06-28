import { createContext, useContext, useState, useMemo, useEffect } from "react"
import { api } from "../services/api"
import { useAuth } from "./AuthContext"

const PropertyContext = createContext()

// Seed data for competitor / nearby properties - static UI decoration
const INITIAL_NEARBY_PROPERTIES = [
  { id: 101, name: "Sea Breeze Residency", location: "Goa", rating: 4.2, price: "₹4,500/night", reviewsCount: 124, distance: "1.2 km away" },
  { id: 102, name: "Ocean Crest Villa", location: "Goa", rating: 4.7, price: "₹8,000/night", reviewsCount: 310, distance: "0.8 km away" },
  { id: 103, name: "Goa Sand Sands Stay", location: "Goa", rating: 3.8, price: "₹3,200/night", reviewsCount: 45, distance: "2.5 km away" },
  { id: 104, name: "Himalayan Pine Lodge", location: "Manali", rating: 4.6, price: "₹5,500/night", reviewsCount: 189, distance: "0.5 km away" },
  { id: 105, name: "Snowy Peaks Homestay", location: "Manali", rating: 4.1, price: "₹4,000/night", reviewsCount: 88, distance: "1.8 km away" },
  { id: 106, name: "Solitude Mountain Inn", location: "Manali", rating: 4.9, price: "₹9,500/night", reviewsCount: 402, distance: "3.2 km away" },
  { id: 107, name: "Naini Haven Resorts", location: "Nainital", rating: 4.5, price: "₹6,000/night", reviewsCount: 201, distance: "0.4 km away" },
  { id: 108, name: "Lake Mist Manor", location: "Nainital", rating: 3.9, price: "₹4,800/night", reviewsCount: 74, distance: "1.5 km away" },
  { id: 109, name: "Forest Edge Cabin", location: "Dehradun", rating: 4.8, price: "₹5,200/night", reviewsCount: 150, distance: "2.1 km away" },
  { id: 110, name: "Mussoorie View Homestay", location: "Dehradun", rating: 4.3, price: "₹3,800/night", reviewsCount: 92, distance: "1.0 km away" },
]

export function PropertyProvider({ children }) {
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [selectedPropertyId, setSelectedPropertyId] = useState("all")
  const [nearbyProperties] = useState(INITIAL_NEARBY_PROPERTIES)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch properties and reviews on mount
  const refreshData = async () => {
    try {
      setLoading(true)
      const [fetchedProperties, fetchedReviews] = await Promise.all([
        api.getProperties(),
        api.getReviews(),
      ])
      setProperties(fetchedProperties)
      setReviews(fetchedReviews)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch data from backend:", err)
      setError(err.message || "Failed to connect to backend server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      refreshData()
    } else {
      setProperties([])
      setReviews([])
      setLoading(false)
    }
  }, [user])

  const addProperty = async (newProp) => {
    try {
      const created = await api.createProperty(newProp)
      setProperties((prev) => [...prev, created])
      return created
    } catch (err) {
      console.error("Failed to add property:", err)
      throw err
    }
  }

  const unflagReview = async (id) => {
    try {
      const updated = await api.flagReview(id, { isSpam: false, isUnflagged: true })
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      )
      return updated
    } catch (err) {
      console.error("Failed to unflag review:", err)
      throw err
    }
  }

  const deleteReview = async (id) => {
    try {
      await api.deleteReview(id)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error("Failed to delete review:", err)
      throw err
    }
  }

  const updateReviewResponse = async (id, responseText) => {
    try {
      const updated = await api.updateReview(id, { response: responseText })
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      )
      return updated
    } catch (err) {
      console.error("Failed to update review response:", err)
      throw err
    }
  }

  const value = useMemo(
    () => ({
      properties,
      selectedPropertyId,
      setSelectedPropertyId,
      addProperty,
      nearbyProperties,
      reviews,
      unflagReview,
      deleteReview,
      updateReviewResponse,
      loading,
      error,
      refreshData
    }),
    [properties, selectedPropertyId, nearbyProperties, reviews, loading, error]
  )

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  )
}

export function useProperty() {
  const ctx = useContext(PropertyContext)
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider")
  return ctx
}
