import os
import shutil

src = r"a:\Projects\TBI\revlens-ai\screenshots\perfect_build\w9_2_render_backend_deployment.png"
dst = r"a:\Projects\TBI\revlens-ai\screenshots\manual_agent\w9_2_render_backend.png"
shutil.copy2(src, dst)
print("Copied Render backend deployment image to manual_agent folder!")
