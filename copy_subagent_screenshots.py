import os
import shutil

SUBAGENT_DIR = r"C:\Users\socia\.gemini\antigravity-ide\brain\2225718d-2c6f-4dc4-8937-106d5b7ac415"
TARGET_DIR = r"a:\Projects\TBI\revlens-ai\screenshots\manual_agent"

mappings = {
    "login_page_1786644729781.png": "w6_2_login_form.png",
    "signup_page_1786644740292.png": "w6_1_registration_form.png",
    "dashboard_overview_1786644793598.png": "w8_1_auth_dashboard.png",
    "ai_reply_loading_1786644804793.png": "w7_2_ai_loading_state.png",
    "ai_reply_generated_1786644807584.png": "w7_3_ai_final_output.png",
    "properties_list_1786644820010.png": "w8_2_create_flow.png",
    "assistant_response_1786644837886.png": "w7_1_ai_user_input.png",
}

for src_name, dst_name in mappings.items():
    src_path = os.path.join(SUBAGENT_DIR, src_name)
    dst_path = os.path.join(TARGET_DIR, dst_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"Copied {src_name} -> {dst_name}")
    else:
        print(f"Missing: {src_path}")

print("Copied subagent screenshots successfully!")
