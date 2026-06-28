import urllib.request
import urllib.parse
import json
import sys
import time

BASE_URL = "http://localhost:8000"
token = None

def run_request(path, method="GET", data=None, params=None):
    global token
    url = f"{BASE_URL}{path}"
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    
    req_data = None
    headers = {}
    if data:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    if token and not path.startswith("/api/auth"):
        headers["Authorization"] = f"Bearer {token}"
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            return response.status, json.loads(res_data) if res_data else None
    except urllib.error.HTTPError as e:
        res_data = e.read().decode("utf-8")
        return e.code, json.loads(res_data) if res_data else None
    except Exception as e:
        print(f"Connection error on {method} {path}: {e}")
        return 0, None

def test_api():
    global token
    print("=" * 60)
    print("REVLENS AI REST API AUTOMATED TEST SUITE (AUTH ENABLED)")
    print("=" * 60)
    
    passed = 0
    total = 0
    
    # Test 1: Root check
    total += 1
    code, res = run_request("/")
    if code == 200 and res.get("status") == "running":
        print("[PASSED] GET / - Status: 200")
        passed += 1
    else:
        print(f"[FAILED] GET / - Status: {code}, Response: {res}")
        return
        
    # Setup Auth: Register User
    total += 1
    test_user = {
        "email": f"test_owner_{time.time()}@example.com",
        "password": "securepassword123",
        "full_name": "Test Owner"
    }
    code, res = run_request("/api/auth/register", method="POST", data=test_user)
    if code == 201 and "access_token" in res:
        token = res["access_token"]
        print(f"[PASSED] POST /api/auth/register - Registered test user successfully")
        passed += 1
    else:
        print(f"[FAILED] POST /api/auth/register - Status: {code}, Response: {res}")
        return

    # Test 2: List properties
    total += 1
    code, res = run_request("/api/properties")
    if code == 200 and isinstance(res, list) and len(res) >= 4:
        print(f"[PASSED] GET /api/properties - Status: 200, Count: {len(res)}")
        passed += 1
    else:
        print(f"[FAILED] GET /api/properties - Status: {code}, Response: {res}")
        
    # Test 3: Create property
    total += 1
    new_prop = {
        "name": "Hilltop Vista",
        "location": "Shimla",
        "price": "₹6,200/night",
        "distance": "1.5 km from Mall Road",
        "is_user_property": True
    }
    code, res = run_request("/api/properties", method="POST", data=new_prop)
    if code == 201 and res.get("id") is not None:
        print(f"[PASSED] POST /api/properties - Status: 201, New ID: {res.get('id')}")
        new_prop_id = res.get("id")
        passed += 1
    else:
        print(f"[FAILED] POST /api/properties - Status: {code}, Response: {res}")
        new_prop_id = None
        
    # Test 4: List reviews
    total += 1
    code, res = run_request("/api/reviews")
    if code == 200 and isinstance(res, list):
        print(f"[PASSED] GET /api/reviews - Status: 200, Count: {len(res)}")
        passed += 1
    else:
        print(f"[FAILED] GET /api/reviews - Status: {code}, Response: {res}")
        
    # Test 5: Get single review
    total += 1
    code, res = run_request("/api/reviews/1")
    if code == 200 and res.get("guest_name") == "Priya Sharma":
        print(f"[PASSED] GET /api/reviews/1 - Status: 200, Guest: {res.get('guest_name')}")
        passed += 1
    else:
        print(f"[FAILED] GET /api/reviews/1 - Status: {code}, Response: {res}")
        
    # Test 6: Create review
    total += 1
    new_review = {
        "property_id": 1,
        "property_name": "Sunset Villa",
        "guest_name": "Rohan Malhotra",
        "rating": 5,
        "text": "The place was clean and spacious. The host was helpful.",
        "date": "2026-06-25",
        "sentiment": "positive",
        "source": "Airbnb",
        "is_spam": False,
        "is_unflagged": False
    }
    code, res = run_request("/api/reviews", method="POST", data=new_review)
    if code == 201 and res.get("id") is not None:
        new_review_id = res.get("id")
        print(f"[PASSED] POST /api/reviews - Status: 201, New Review ID: {new_review_id}")
        passed += 1
    else:
        print(f"[FAILED] POST /api/reviews - Status: {code}, Response: {res}")
        new_review_id = None
        
    # Test 7: Update review
    total += 1
    if new_review_id:
        update_data = {"rating": 4, "text": "Clean and spacious, minor issues with check-in."}
        code, res = run_request(f"/api/reviews/{new_review_id}", method="PUT", data=update_data)
        if code == 200 and res.get("rating") == 4:
            print(f"[PASSED] PUT /api/reviews/{new_review_id} - Status: 200, Updated Rating: 4")
            passed += 1
        else:
            print(f"[FAILED] PUT /api/reviews/{new_review_id} - Status: {code}, Response: {res}")
    else:
        print("[SKIPPED] PUT /api/reviews - Create Review failed")
        
    # Test 8: Flag review as spam
    total += 1
    if new_review_id:
        code, res = run_request(f"/api/reviews/{new_review_id}/flag", method="PATCH", params={"is_spam": True})
        if code == 200 and res.get("is_spam") is True:
            print(f"[PASSED] PATCH /api/reviews/{new_review_id}/flag - Status: 200, Is Spam: True")
            passed += 1
        else:
            print(f"[FAILED] PATCH /api/reviews/{new_review_id}/flag - Status: {code}, Response: {res}")
    else:
        print("[SKIPPED] PATCH /api/reviews/flag - Create Review failed")
        
    # Test 9: Search reviews
    total += 1
    code, res = run_request("/api/reviews/search", params={"q": "clean"})
    if code == 200 and isinstance(res, list):
        print(f"[PASSED] GET /api/reviews/search - Status: 200, Found: {len(res)}")
        passed += 1
    else:
        print(f"[FAILED] GET /api/reviews/search - Status: {code}, Response: {res}")
        
    # Test 10: Sentiment summary
    total += 1
    code, res = run_request("/api/reviews/sentiment-summary")
    if code == 200 and "positive" in res and "negative" in res:
        print(f"[PASSED] GET /api/reviews/sentiment-summary - Status: 200, Summary: {res}")
        passed += 1
    else:
        print(f"[FAILED] GET /api/reviews/sentiment-summary - Status: {code}, Response: {res}")
        
    # Test 11: Delete review
    total += 1
    if new_review_id:
        code, res = run_request(f"/api/reviews/{new_review_id}", method="DELETE")
        if code == 200:
            print(f"[PASSED] DELETE /api/reviews/{new_review_id} - Status: 200")
            passed += 1
        else:
            print(f"[FAILED] DELETE /api/reviews/{new_review_id} - Status: {code}, Response: {res}")
    else:
        print("[SKIPPED] DELETE /api/reviews - Create Review failed")
        
    # Test 12: 404 Error Test
    total += 1
    code, res = run_request("/api/reviews/99999")
    if code == 404:
        print(f"[PASSED] GET /api/reviews/99999 (404 Error Test) - Status: 404, Error Details: {res}")
        passed += 1
    else:
        print(f"[FAILED] GET /api/reviews/99999 (404 Error Test) - Status: {code}, Response: {res}")
        
    print("-" * 60)
    score = (passed / total) * 100
    print(f"Total Tests: {total} | Passed: {passed} | Score: {score:.1f}%")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
