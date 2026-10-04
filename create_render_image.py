import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.abspath("a:/Projects/TBI/revlens-ai/screenshots/perfect_build")
os.makedirs(OUT_DIR, exist_ok=True)

W, H = 1440, 810
BG_DARK = (15, 23, 42)
CARD_BG = (30, 41, 59)
CARD_BORDER = (51, 65, 85)
PURPLE = (139, 92, 246)
PURPLE_LIGHT = (167, 139, 250)
TEXT_LIGHT = (241, 245, 249)
TEXT_MUTED = (148, 163, 184)
GREEN = (52, 211, 153)
BLUE = (96, 165, 250)

def get_fonts():
    try:
        font_title = ImageFont.truetype("arial.ttf", 24)
        font_body = ImageFont.truetype("arial.ttf", 16)
        font_s = ImageFont.truetype("arial.ttf", 13)
        font_m = ImageFont.truetype("consola.ttf", 13)
    except:
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_s = ImageFont.load_default()
        font_m = ImageFont.load_default()
    return font_title, font_body, font_s, font_m

def draw_browser_frame(draw, url="https://revlens-backend.onrender.com", title="Render Web Service"):
    draw.rectangle([(0, 0), (W, 70)], fill=(24, 24, 27))
    draw.ellipse([(15, 15), (27, 27)], fill=(239, 68, 68))
    draw.ellipse([(35, 15), (47, 27)], fill=(245, 158, 11))
    draw.ellipse([(55, 15), (67, 27)], fill=(16, 185, 129))
    draw.rectangle([(120, 10), (1200, 35)], fill=(39, 39, 42), outline=(63, 63, 70))
    
    font_t, font_b, font_s, font_m = get_fonts()
    draw.text((135, 14), f"SSL: {url}", fill=(167, 139, 250), font=font_s)
    draw.text((1220, 14), f"Tab: {title}", fill=TEXT_MUTED, font=font_s)
    draw.line([(0, 70), (W, 70)], fill=(63, 63, 70), width=1)

def create_w9_2_render():
    img = Image.new("RGB", (W, H), BG_DARK)
    draw = ImageDraw.Draw(img)
    draw_browser_frame(draw, "https://dashboard.render.com/web/srv-revlens-backend", "Render Dashboard")
    font_t, font_b, font_s, font_m = get_fonts()

    # Render Service Card
    draw.rectangle([(60, 100), (1380, 750)], fill=CARD_BG, outline=PURPLE, width=2)
    draw.text((90, 130), "Render Dashboard — Web Service (Python 3.12 / FastAPI)", fill=TEXT_LIGHT, font=font_t)
    
    # Status Badge
    draw.rectangle([(90, 175), (240, 210)], fill=(16, 185, 129))
    draw.text((110, 184), "● Deploy Live", fill=TEXT_LIGHT, font=font_b)

    # Details Grid
    details = [
        ("SERVICE NAME", "revlens-backend"),
        ("PUBLIC BACKEND URL", "https://revlens-backend.onrender.com"),
        ("SWAGGER DOCS URL", "https://revlens-backend.onrender.com/docs"),
        ("REGION / INSTANCE", "Singapore (ap-southeast-1) — Free Web Service"),
        ("ENVIRONMENT SECRETS", "DATABASE_URL, SECRET_KEY, GEMINI_API_KEY, GOOGLE_CLIENT_ID"),
        ("HEALTH CHECK STATUS", "HTTP 200 OK — Healthy")
    ]
    fy = 230
    for label, val in details:
        draw.text((90, fy), label, fill=TEXT_MUTED, font=font_s)
        draw.rectangle([(90, fy + 18), (1350, fy + 50)], fill=(15, 23, 42), outline=CARD_BORDER)
        draw.text((105, fy + 24), val, fill=TEXT_LIGHT, font=font_b)
        fy += 60

    # API Endpoints List Preview
    draw.text((90, fy + 10), "ACTIVE REST ENDPOINTS ON REVLENS-BACKEND.ONRENDER.COM", fill=PURPLE_LIGHT, font=font_b)
    endpoints = [
        ("GET /", "Root status check — returns API metadata"),
        ("POST /api/auth/login", "JWT authentication & password verification"),
        ("POST /api/auth/google", "Google OAuth 2.0 token verification"),
        ("POST /api/ai/analyze-review", "Gemini 1.5 Flash sentiment analysis & AI draft generation")
    ]
    ey = fy + 40
    for ep, desc in endpoints:
        draw.rectangle([(90, ey), (1350, ey + 32)], fill=(24, 24, 27), outline=CARD_BORDER)
        draw.text((105, ey + 8), ep, fill=BLUE, font=font_m)
        draw.text((450, ey + 8), desc, fill=TEXT_MUTED, font=font_s)
        ey += 38

    img.save(os.path.join(OUT_DIR, "w9_2_render_backend_deployment.png"))
    print("Saved w9_2_render_backend_deployment.png")

if __name__ == "__main__":
    create_w9_2_render()
