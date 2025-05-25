import os
import requests
import sys
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def generate_questions(technology):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}"
    headers = { "Content-Type": "application/json" }

    prompt = f"Generate 5 technical interview questions on {technology}. Respond as a plain list."

    payload = {
        "contents": [
            {
                "parts": [
                    { "text": prompt }
                ]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No technology provided.")
        sys.exit(1)
    
    tech = sys.argv[1]
    result = generate_questions(tech)
    print(result)


