import React, { createContext, use, useReducer, useMemo, useEffect, useCallback } from "react"
import { api } from "../services/api"
import { useAuth } from "./AuthContext"

const PropertyContext = createContext()

const initialState = {
  properties: [],
  selectedPropertyId: "all",
  reviews: [],
  loading: true,
  hydrated: false, // true once any data (cached or fresh) is on screen: later refreshes don't blank it
  error: null,
}

// Last data per user for this tab, so the dashboard paints instantly and refreshes underneath
const cacheKey = (userId) => `revlens_data:v1:${userId}`
function readCache(userId) {
  try {
    return JSON.parse(sessionStorage.getItem(cacheKey(userId)))
  } catch {
    return null
  }
}
function writeCache(userId, data) {
  try {
    sessionStorage.setItem(cacheKey(userId), JSON.stringify(data))
  } catch {
    // storage full or blocked: the cache is only an optimisation
  }
}

function propertyReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: !state.hydrated, error: null }
    case "FETCH_SUCCESS":
      return {
        ...state,
        properties: action.payload.properties,
        reviews: action.payload.reviews,
        error: null,
        loading: false,
        hydrated: true,
      }
    case "FETCH_FAILURE":
      return { ...state, error: action.payload, loading: false }
    case "CLEAR_DATA":
      return {
        ...state,
        properties: [],
        reviews: [],
        loading: false,
        hydrated: false,
        error: null,
      }
    case "SET_SELECTED_PROPERTY":
      return { ...state, selectedPropertyId: action.payload }
    case "ADD_PROPERTY_SUCCESS":
      return { ...state, properties: [...state.properties, action.payload] }
    case "ADD_REVIEWS_SUCCESS":
      return { ...state, reviews: [...action.payload, ...state.reviews] }
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
  const { properties, selectedPropertyId, reviews, loading, error } = state

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

  const userId = user?.id
  useEffect(() => {
    if (userId) {
      const cached = readCache(userId)
      if (cached) dispatch({ type: "FETCH_SUCCESS", payload: cached })
      refreshData()
    } else {
      dispatch({ type: "CLEAR_DATA" })
    }
  }, [userId, refreshData])

  // Keep the tab cache in step with every change (fetches and edits alike)
  useEffect(() => {
    if (userId && state.hydrated) writeCache(userId, { properties, reviews })
  }, [userId, state.hydrated, properties, reviews])

  const setSelectedPropertyId = useCallback((id) => {
    dispatch({ type: "SET_SELECTED_PROPERTY", payload: id })
  }, [])

  const addReview = useCallback(async (review) => {
    const created = await api.createReview(review)
    dispatch({ type: "ADD_REVIEWS_SUCCESS", payload: [created] })
    return created
  }, [])

  // Sends rows in chunks of 25 (the API limit), so a large import shows progress and never hits a request
  // timeout. Chunks already sent stay imported if a later one fails; re-running is safe (duplicates are skipped).
  const importReviews = useCallback(async (propertyId, rows, onProgress) => {
    const summary = { created: [], duplicates: 0, failed: 0, error: null }
    for (let start = 0; start < rows.length; start += 25) {
      const chunk = rows.slice(start, start + 25)
      try {
        const { created, duplicates } = await api.importReviews(propertyId, chunk)
        summary.created.push(...created)
        summary.duplicates += duplicates.length
        if (created.length) dispatch({ type: "ADD_REVIEWS_SUCCESS", payload: created })
      } catch (err) {
        summary.failed = rows.length - start
        summary.error = err.message || "Import failed"
        break
      }
      onProgress?.(Math.min(start + chunk.length, rows.length))
    }
    return summary
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
      addReview,
      importReviews,
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
      addReview,
      importReviews,
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
