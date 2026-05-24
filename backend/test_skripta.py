import httpx

# IZBRISATI CIJELI FILE KASNIJE

BASE = "" # staviti localhost
USERNAME = "" # moj FER mail
PASSWORD = "" # sifra iz maila

# login
login_response = httpx.post(
    f"{BASE}/login",
    data={"username": USERNAME, "password": PASSWORD},
)
login_response.raise_for_status()
token = login_response.json()["access_token"]
print(f"Got token: {token[:30]}...")

# pozivam /test s tokenom
test_response = httpx.get(
    f"{BASE}/test",
    headers={"Authorization": f"Bearer {token}"},
)
print(f"Status: {test_response.status_code}")
print(f"Body: {test_response.json()}")
