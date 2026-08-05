import React, { createContext, use, useReducer, useMemo, useEffect, useCallback } from "react"
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

const initialState = {
  properties: [],
  selectedPropertyId: "all",
  nearbyProperties: INITIAL_NEARBY_PROPERTIES,
  reviews: [],
  loading: true,
  error: null,
}

function propertyReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null }
    case "FETCH_SUCCESS":
      return {
        ...state,
        properties: action.payload.properties,
        reviews: action.payload.reviews,
        error: null,
        loading: false,
      }
    case "FETCH_FAILURE":
      return { ...state, error: action.payload, loading: false }
    case "CLEAR_DATA":
      return {
        ...state,
        properties: [],
        reviews: [],
        loading: false,
        error: null,
      }
    case "SET_SELECTED_PROPERTY":
      return { ...state, selectedPropertyId: action.payload }
    case "ADD_PROPERTY_SUCCESS":
      return { ...state, properties: [...state.properties, action.payload] }
    case "UPDATE_REVIEW_SUCCESS":
      return {
        ...state,
        reviews: state.reviews.map((r) => (r.id === action.payload.id ? action.payload.data : r)),
      }
    case "DELETE_REVIEW_SUCCESS":
      return { ...state, reviews: state.reviews.filter((r) => r.id !== action.payload) }
    default:
      return state
  }
}

export function PropertyProvider({ children }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(propertyReducer, initialState)
  const { properties, selectedPropertyId, nearbyProperties, reviews, loading, error } = state

  // Fetch properties and reviews on mount
  const refreshData = useCallback(async () => {
    dispatch({ type: "FETCH_START" })
    try {
      const [fetchedProperties, fetchedReviews] = await Promise.all([
        api.getProperties(),
        api.getReviews(),
      ])
      dispatch({
        type: "FETCH_SUCCESS",
        payload: { properties: fetchedProperties, reviews: fetchedReviews },
      })
    } catch (err) {
      console.error("Failed to fetch data from backend:", err)
      dispatch({
        type: "FETCH_FAILURE",
        payload: err.message || "Failed to connect to backend server",
      })
    }
  }, [])

  useEffect(() => {
    if (user) {
      refreshData()
    } else {
      dispatch({ type: "CLEAR_DATA" })
    }
  }, [user, refreshData])

  const setSelectedPropertyId = useCallback((id) => {
    dispatch({ type: "SET_SELECTED_PROPERTY", payload: id })
  }, [])

  const addProperty = useCallback(async (newProp) => {
    try {
      const created = await api.createProperty(newProp)
      dispatch({ type: "ADD_PROPERTY_SUCCESS", payload: created })
      return created
    } catch (err) {
      console.error("Failed to add property:", err)
      throw err
    }
  }, [])

  const unflagReview = useCallback(async (id) => {
    try {
      const updated = await api.flagReview(id, { isSpam: false, isUnflagged: true })
      dispatch({ type: "UPDATE_REVIEW_SUCCESS", payload: { id, data: updated } })
      return updated
    } catch (err) {
      console.error("Failed to unflag review:", err)
      throw err
    }
  }, [])

  const deleteReview = useCallback(async (id) => {
    try {
      await api.deleteReview(id)
      dispatch({ type: "DELETE_REVIEW_SUCCESS", payload: id })
    } catch (err) {
      console.error("Failed to delete review:", err)
      throw err
    }
  }, [])

  const updateReviewResponse = useCallback(async (id, responseText) => {
    try {
      const updated = await api.updateReview(id, { response: responseText })
      dispatch({ type: "UPDATE_REVIEW_SUCCESS", payload: { id, data: updated } })
      return updated
    } catch (err) {
      console.error("Failed to update review response:", err)
      throw err
    }
  }, [])

  const generateReply = useCallback(async (id) => {
    try {
      return await api.generateReply(id)
    } catch (err) {
      console.error("Failed to generate AI reply:", err)
      throw err
    }
  }, [])

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
      generateReply,
      loading,
      error,
      refreshData,
    }),
    [
      properties,
      selectedPropertyId,
      setSelectedPropertyId,
      addProperty,
      nearbyProperties,
      reviews,
      unflagReview,
      deleteReview,
      updateReviewResponse,
      generateReply,
      loading,
      error,
      refreshData,
    ]
  )

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  )
}

export function useProperty() {
  const ctx = use(PropertyContext)
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider")
  return ctx
}
