import os
import requests
import logging

logger = logging.getLogger(__name__)

# Retrieve API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def generate_management_response(guest_name: str, property_name: str, rating: int, text: str) -> str:
    """
    Calls the Google Gemini API to generate a warm, professional management response.
    Falls back to a simulated template if the API key is not configured or calls fail.
    """
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY not configured. Falling back to local generation.")
        return generate_mock_response(guest_name, property_name, rating, text)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = (
        f"You are the management team of a premium homestay property called '{property_name}'. "
        f"Write a warm, professional, on-brand response to the following guest review:\n\n"
        f"Guest Name: {guest_name}\n"
        f"Rating: {rating}/5 stars\n"
        f"Review: \"{text}\"\n\n"
        f"Guidelines:\n"
        f"1. Be hospitable and polite.\n"
        f"2. Acknowledge any compliments (if rating is high) or apologize and state we are fixing issues (if rating is low).\n"
        f"3. Keep the response under 3-4 sentences.\n"
        f"4. Do NOT include placeholders like '[Your Name]', '[Property Management]', or '[Host Name]' at the end. Make it complete and natural.\n"
        f"5. Output ONLY the response text itself."
    )

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    try:
        res = requests.post(url, json=payload, timeout=10)
        res.raise_for_status()
        data = res.json()
        
        # Extract text from Gemini structure
        candidates = data.get("candidates", [])
        if candidates:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts:
                response_text = parts[0].get("text", "").strip()
                if response_text:
                    return response_text
        
        logger.error(f"Gemini API returned unexpected structure: {data}")
        return generate_mock_response(guest_name, property_name, rating, text)
    except Exception as e:
        logger.error(f"Failed to call Gemini API: {e}. Falling back.")
        return generate_mock_response(guest_name, property_name, rating, text)


def generate_mock_response(guest_name: str, property_name: str, rating: int, text: str) -> str:
    """
    Fallback mock response generator based on rating.
    """
    if rating >= 4:
        return f"Hi {guest_name}, thank you so much for your wonderful review of {property_name}! We are absolutely thrilled you enjoyed your stay and hope to welcome you back soon."
    elif rating <= 2:
        return f"Hi {guest_name}, we are very sorry to hear that your stay at {property_name} did not meet expectations. We are looking into the concerns you raised to ensure they are immediately resolved."
    else:
        return f"Hi {guest_name}, thank you for sharing your experience at {property_name}. We appreciate your constructive feedback and will work on improving the property based on your suggestions."


def analyze_review_sentiment_and_spam(text: str, guest_name: str) -> tuple[str, bool]:
    """
    Analyzes review text using Gemini API.
    Returns a tuple: (sentiment: str, is_spam: bool)
    Falls back to simple heuristics if the API key is not configured or fails.
    """
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        return classify_sentiment_locally(text), detect_spam_locally(text, guest_name)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = (
        f"Analyze the following guest review and return its classification as a JSON object with keys:\n"
        f"- 'sentiment': strictly 'positive', 'neutral', or 'negative'\n"
        f"- 'is_spam': boolean true if it's promotional spam, gibberish bot text, or repeated fake content, otherwise false\n\n"
        f"Review Details:\n"
        f"Guest: {guest_name}\n"
        f"Text: \"{text}\"\n\n"
        f"Output ONLY the JSON object. Do not include markdown wraps."
    )

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    try:
        res = requests.post(url, json=payload, timeout=10)
        res.raise_for_status()
        data = res.json()
        candidates = data.get("candidates", [])
        if candidates:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts:
                text_out = parts[0].get("text", "").strip()
                # Clean markdown JSON wraps if present
                if text_out.startswith("```"):
                    text_out = text_out.split("```")[1]
                    if text_out.startswith("json"):
                        text_out = text_out[4:]
                text_out = text_out.strip()
                
                import json
                result = json.loads(text_out)
                sentiment = result.get("sentiment", "neutral")
                if sentiment not in ["positive", "neutral", "negative"]:
                    sentiment = "neutral"
                is_spam = bool(result.get("is_spam", False))
                return sentiment, is_spam
    except Exception as e:
        logger.error(f"Failed to classify review via Gemini: {e}")
        
    return classify_sentiment_locally(text), detect_spam_locally(text, guest_name)


def classify_sentiment_locally(text: str) -> str:
    lower_text = text.lower()
    positive_words = ["great", "excellent", "wonderful", "amazing", "love", "perfect", "good", "friendly", "clean", "beautiful"]
    negative_words = ["poor", "bad", "terrible", "disappointed", "dirty", "noisy", "heating", "broken", "worst", "unprofessional"]
    
    pos_count = sum(1 for w in positive_words if w in lower_text)
    neg_count = sum(1 for w in negative_words if w in lower_text)
    
    if pos_count > neg_count:
        return "positive"
    elif neg_count > pos_count:
        return "negative"
    return "neutral"


def detect_spam_locally(text: str, guest_name: str) -> bool:
    lower_text = text.lower()
    spam_keywords = ["http://", "https://", "discount", "promo", "click here", "fake review", "repeated times"]
    if any(k in lower_text for k in spam_keywords):
        return True
    
    if len(text) > 10 and ("asdf" in lower_text or "qwerty" in lower_text):
        return True
        
    return False
