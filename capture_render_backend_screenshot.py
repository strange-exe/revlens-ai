import os
import time
from playwright.sync_api import sync_playwright

OUT_DIR = os.path.abspath("a:/Projects/TBI/revlens-ai/screenshots/manual_agent")
os.makedirs(OUT_DIR, exist_ok=True)

def capture_render_backend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        page = context.new_page()

        print("[1/2] Navigating to https://revlens-backend.onrender.com/ ...")
        try:
            page.goto("https://revlens-backend.onrender.com/", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)
        except Exception as e:
            print(f"Warn: {e}")
        
        page.screenshot(path=os.path.join(OUT_DIR, "w9_2_render_backend.png"))
        print("Saved w9_2_render_backend.png")

        print("[2/2] Navigating to https://revlens-backend.onrender.com/docs ...")
        try:
            page.goto("https://revlens-backend.onrender.com/docs", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)
        except Exception as e:
            print(f"Warn: {e}")

        page.screenshot(path=os.path.join(OUT_DIR, "w9_2_render_swagger_docs.png"))
        print("Saved w9_2_render_swagger_docs.png")

        browser.close()

if __name__ == "__main__":
    capture_render_backend()
