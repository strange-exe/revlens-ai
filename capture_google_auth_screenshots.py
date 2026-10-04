import os
import time
from playwright.sync_api import sync_playwright

LINKEDIN_DIR = os.path.abspath("a:/Projects/TBI/revlens-ai/linkedin")
SCREENSHOTS_DIR = os.path.abspath("a:/Projects/TBI/revlens-ai/screenshots")
os.makedirs(LINKEDIN_DIR, exist_ok=True)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

TARGET_URL = "https://revlens.abhinesh.codes"

def capture():
    with sync_playwright() as p:
        # Try launch with msedge or chrome or default chromium
        browser = None
        for channel in ["msedge", "chrome", None]:
            try:
                if channel:
                    browser = p.chromium.launch(headless=True, channel=channel)
                else:
                    browser = p.chromium.launch(headless=True)
                print(f"Successfully launched browser with channel={channel}")
                break
            except Exception as e:
                print(f"Failed with channel={channel}: {e}")

        if not browser:
            print("Could not launch any browser channel.")
            return

        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = context.new_page()

        print(f"Navigating to login page: {TARGET_URL}/login")
        page.goto(f"{TARGET_URL}/login", wait_until="networkidle")
        time.sleep(2)

        # Capture Login Page showing Google Auth button
        login_img = os.path.join(LINKEDIN_DIR, "4_google_auth_login.png")
        page.screenshot(path=login_img, full_page=False)
        print(f"Saved: {login_img}")

        # Inject Google Authenticated User Session into LocalStorage
        google_user = {
            "id": "google-user-abhinesh-26100587",
            "email": "work.abhinesh@gmail.com",
            "fullName": "Abhinesh Gangwar (Google)",
            "full_name": "Abhinesh Gangwar (Google)",
            "picture": "https://lh3.googleusercontent.com/a/ACg8ocK-test-avatar",
            "googleId": "108726100587998273645",
            "google_id": "108726100587998273645"
        }
        mock_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.google_authenticated_session_token"

        page.evaluate("""([user, token]) => {
            localStorage.setItem('revlens_token:v1', token);
            localStorage.setItem('revlens_user:v1', JSON.stringify(user));
        }""", [google_user, mock_token])

        # Navigate to Dashboard logged in with Google
        print(f"Navigating to Dashboard: {TARGET_URL}/dashboard")
        page.goto(f"{TARGET_URL}/dashboard", wait_until="networkidle")
        time.sleep(3)

        dashboard_img = os.path.join(LINKEDIN_DIR, "1_dashboard_google_logged_in.png")
        page.screenshot(path=dashboard_img, full_page=False)
        print(f"Saved: {dashboard_img}")

        shutil_dashboard = os.path.join(SCREENSHOTS_DIR, "google_dashboard_logged_in.png")
        page.screenshot(path=shutil_dashboard, full_page=False)
        print(f"Saved: {shutil_dashboard}")

        # Capture AI Response Assistant view
        print(f"Navigating to AI Assistant: {TARGET_URL}/dashboard?tab=assistant")
        page.goto(f"{TARGET_URL}/dashboard?tab=assistant", wait_until="networkidle")
        time.sleep(2)

        assistant_img = os.path.join(LINKEDIN_DIR, "2_ai_assistant_google_logged_in.png")
        page.screenshot(path=assistant_img, full_page=False)
        print(f"Saved: {assistant_img}")

        browser.close()
        print("All Google login screenshots captured successfully!")

if __name__ == "__main__":
    capture()
