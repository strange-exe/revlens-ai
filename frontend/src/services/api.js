/**
 * RevLens AI - API Service
 * All calls go through the Vite proxy (/api -> http://localhost:8000/api) or fallback directly in dev.
 * Response normalizers convert snake_case -> camelCase so all existing
 * component code (r.propertyId, r.guestName, etc.) keeps working unchanged.
 */

const getApiBase = () => {
  const url = import.meta.env.VITE_API_URL
  if (!url) return '/api'
  return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`
}
const BASE = getApiBase()

const TOKEN_KEY = "revlens_token:v1"
const USER_KEY = "revlens_user:v1"

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = { 
    'Content-Type': 'application/json', 
    ...options.headers 
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })
  
  if (!res.ok) {
    // If unauthorized, clear local session so user is redirected by ProtectedRoute
    if (res.status === 401 && !path.startsWith("/auth") && window.location.pathname !== "/login") {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.href = "/login"
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw Object.assign(new Error(err.detail || 'API error'), { status: res.status })
  }
  if (res.status === 204) return null
  return res.json()
}

// ── Normalizers ────────────────────────────────────────────────────────────

function normalizeMe(data) {
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    picture: data.picture,
    googleId: data.google_id,
    trainingConsentAt: data.training_consent_at ?? null,
    trainingConsentVersion: data.training_consent_version ?? null,
  }
}

function normalizeReview(r) {
  return {
    id: r.id,
    propertyId: r.property_id,
    propertyName: r.property_name,
    guestName: r.guest_name,
    rating: r.rating,
    text: r.text,
    date: r.date,
    sentiment: r.sentiment,
    source: r.source,
    isSpam: r.is_spam ?? false,
    isUnflagged: r.is_unflagged ?? false,
    response: r.response ?? null,
    labelSource: r.label_source ?? null,
    aspects: r.aspects ?? null,
  }
}

function normalizeProperty(p) {
  return {
    id: p.id,
    name: p.name,
    location: p.location,
    price: p.price,
    distance: p.distance,
    rating: p.rating,
    reviewsCount: p.reviews_count,
    isUserProperty: p.is_user_property,
    userId: p.user_id,
  }
}

function denormalizeReviewCreate(r) {
  return {
    property_id: r.propertyId,
    property_name: r.propertyName,
    guest_name: r.guestName,
    rating: r.rating,
    text: r.text,
    date: r.date,
    sentiment: r.sentiment,
    source: r.source,
    is_spam: r.isSpam ?? false,
    is_unflagged: r.isUnflagged ?? false,
    response: r.response ?? null,
  }
}

export const api = {
  // Auth
  async register(userData) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName || null
      }),
    })
    return data
  },

  async login(loginData) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    })
    return data
  },

  async googleLogin(reqData) {
    const data = await request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(reqData),
    })
    return data
  },

  async getMe() {
    return normalizeMe(await request('/auth/me'))
  },

  // Opt in to (or withdraw from) letting this account's reviews and corrections train the model
  async setTrainingConsent(consent) {
    return normalizeMe(await request('/auth/me/training-consent', { method: 'PUT', body: JSON.stringify({ consent }) }))
  },

  // Permanently deletes the account, its properties and their reviews; the email must match the account's
  async deleteAccount(confirmEmail) {
    return request('/auth/me', { method: 'DELETE', body: JSON.stringify({ confirm_email: confirmEmail }) })
  },

  // Properties
  async getProperties() {
    const data = await request('/properties')
    return data.map(normalizeProperty)
  },

  async createProperty(prop) {
    const body = {
      name: prop.name,
      location: prop.location,
      price: prop.price || null, // never invent a price
      distance: prop.distance || null,
      is_user_property: prop.isUserProperty !== false,
      user_id: prop.userId || null,
    }
    const data = await request('/properties', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return normalizeProperty(data)
  },

  // Reviews
  async getReviews(params = {}) {
    const query = new URLSearchParams()
    if (params.propertyId && params.propertyId !== 'all') {
      query.append('property_id', params.propertyId)
    }
    if (params.sentiment) {
      query.append('sentiment', params.sentiment)
    }
    const path = `/reviews?${query.toString()}`
    const data = await request(path)
    return data.map(normalizeReview)
  },

  async getReview(id) {
    const data = await request(`/reviews/${id}`)
    return normalizeReview(data)
  },

  async createReview(review) {
    const body = denormalizeReviewCreate(review)
    const data = await request('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return normalizeReview(data)
  },

  // Import up to 25 reviews into one of your properties; returns the created reviews and skipped duplicates
  async importReviews(propertyId, reviews) {
    const data = await request('/reviews/bulk', {
      method: 'POST',
      body: JSON.stringify({
        property_id: Number(propertyId),
        reviews: reviews.map((r) => ({ guest_name: r.guest, rating: r.rating, text: r.text, date: r.date, source: r.source })),
      }),
    })
    return { created: data.created.map(normalizeReview), duplicates: data.duplicates }
  },

  async generateReply(id) {
    const data = await request(`/reviews/${id}/generate-reply`, {
      method: 'POST',
    })
    // source: "llm" (AI-written) or "template" (AI unavailable)
    return { reply: data.reply, source: data.source ?? "unknown" }
  },

  async updateReview(id, updates) {
    const body = {}
    if (updates.rating !== undefined) body.rating = updates.rating
    if (updates.text !== undefined) body.text = updates.text
    if (updates.sentiment !== undefined) body.sentiment = updates.sentiment
    if (updates.isSpam !== undefined) body.is_spam = updates.isSpam
    if (updates.isUnflagged !== undefined) body.is_unflagged = updates.isUnflagged
    if (updates.response !== undefined) body.response = updates.response

    const data = await request(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    return normalizeReview(data)
  },

  async flagReview(id, { isSpam, isUnflagged }) {
    const query = new URLSearchParams()
    if (isSpam !== undefined) query.append('is_spam', isSpam ? 'true' : 'false')
    if (isUnflagged !== undefined) query.append('is_unflagged', isUnflagged ? 'true' : 'false')
    const data = await request(`/reviews/${id}/flag?${query.toString()}`, {
      method: 'PATCH',
    })
    return normalizeReview(data)
  },

  async deleteReview(id) {
    const data = await request(`/reviews/${id}`, {
      method: 'DELETE',
    })
    return normalizeReview(data)
  },

  async searchReviews(q) {
    const data = await request(`/reviews/search?q=${encodeURIComponent(q)}`)
    return data.map(normalizeReview)
  },

  async getSentimentSummary(propertyId) {
    const path = propertyId && propertyId !== 'all' 
      ? `/reviews/sentiment-summary?property_id=${propertyId}` 
      : '/reviews/sentiment-summary'
    return request(path)
  },

  /** { classifier: "model"|"llm"|"heuristic", classifier_name, replies: "llm"|"template" } */
  async getAiStatus() {
    return request('/ai/status')
  },

  /** Ask a question about your reviews. -> { answer, citations: [review ids], source: "llm"|"unavailable" } */
  async askAssistant(question, propertyId) {
    return request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, property_id: propertyId && propertyId !== 'all' ? Number(propertyId) : null }),
    })
  }
}
