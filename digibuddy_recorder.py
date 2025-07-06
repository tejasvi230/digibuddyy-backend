import pyautogui
import time
import requests
import json
from datetime import datetime

SAVE_INTERVAL = 10  # seconds
BACKEND_URL = "http://localhost:5000/upload"
JSON_FILE = "activity_log.json"

# Create or load existing JSON file
try:
    with open(JSON_FILE, "r") as f:
        activity_log = json.load(f)
except FileNotFoundError:
    activity_log = []

screenshot_count = 1

print("🔴 DigiBuddy recording started... Press Ctrl+C to stop.")

try:
    while True:
        timestamp = datetime.now().isoformat()
        filename = f"screenshot_{screenshot_count}.png"

        # 1. Take screenshot
        screenshot = pyautogui.screenshot()
        screenshot.save(filename)

        # 2. Upload to backend
        with open(filename, "rb") as image_file:
            files = {"screenshot": image_file}
            response = requests.post(BACKEND_URL, files=files)

        # 3. Get OCR result from backend
        if response.status_code == 200:
            data = response.json()
            extracted_text = data.get("text", "")
        else:
            extracted_text = "OCR failed"

        # 4. Save data locally
        activity_log.append({
            "timestamp": timestamp,
            "text": extracted_text,
            "image": filename
        })

        with open(JSON_FILE, "w") as f:
            json.dump(activity_log, f, indent=2)

        print(f"✅ Screenshot {screenshot_count} processed.")
        screenshot_count += 1
        time.sleep(SAVE_INTERVAL)

except KeyboardInterrupt:
    print("🛑 Recording stopped. Data saved to activity_log.json.")
