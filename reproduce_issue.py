import requests
import json

url = 'http://localhost:5000/api/bazi'
data = {
    "birthDate": "2024-01-01",
    "birthTime": "12:00",
    "gender": "male",
    "timezone": "Asia/Taipei"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
