import { createContext, useContext, useState, useMemo } from "react"
import { properties as initialProperties, mockReviews as initialReviews } from "../data/mockReviews"

const PropertyContext = createContext()

// Seed data for competitor / nearby properties
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
  const [properties, setProperties] = useState(initialProperties)
  const [selectedPropertyId, setSelectedPropertyId] = useState("all")
  const [nearbyProperties] = useState(INITIAL_NEARBY_PROPERTIES)
  const [reviews, setReviews] = useState(initialReviews)

  const addProperty = (newProp) => {
    const freshProp = {
      id: properties.length + 1,
      name: newProp.name,
      location: newProp.location,
    }
    setProperties((prev) => [...prev, freshProp])
  }

  const unflagReview = (id) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isUnflagged: true } : r))
    )
  }

  const deleteReview = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id))
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
    }),
    [properties, selectedPropertyId, nearbyProperties, reviews]
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
