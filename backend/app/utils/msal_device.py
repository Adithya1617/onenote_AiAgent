import os
import msal
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
TENANT_ID = os.getenv("TENANT_ID", "common")
"""
Scope handling rules:
- Accept GRAPH_SCOPES as space- or comma-separated values
- Remove reserved scopes (offline_access, openid, profile) – MSAL handles them
- If a scope doesn't start with http, prefix with Graph resource
"""
GRAPH_SCOPES_ENV = os.getenv("GRAPH_SCOPES", "User.Read Notes.ReadWrite")
raw_scopes = [s.strip() for part in GRAPH_SCOPES_ENV.split(',') for s in part.split() if s.strip()]
RESERVED_SCOPES = {"offline_access", "openid", "profile"}

SCOPES = []
for s in raw_scopes:
    if s in RESERVED_SCOPES:
        continue
    if not s.lower().startswith("http"):
        s = f"https://graph.microsoft.com/{s}"
    SCOPES.append(s)

AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"

# For a simple local dev, use an in-memory cache.
# If you want persistence, plug msal.SerializableTokenCache to a file.
_app = msal.PublicClientApplication(client_id=CLIENT_ID, authority=AUTHORITY)

def get_token_silent() -> Optional[str]:
    accounts = _app.get_accounts()
    if accounts:
        result = _app.acquire_token_silent(SCOPES, account=accounts[0])
        if result and "access_token" in result:
            return result["access_token"]
    return None

def get_token_interactive() -> str:
    flow = _app.initiate_device_flow(scopes=SCOPES)
    if "user_code" not in flow:
        raise RuntimeError("Failed to initiate device code flow. Check 'Allow public client flows' in Azure.")
    # Important: this prints a message with a URL + code in your server logs.
    print(flow["message"])
    result = _app.acquire_token_by_device_flow(flow)
    if "access_token" not in result:
        raise RuntimeError(f"Auth failed: {result.get('error_description')}")
    return result["access_token"]

def get_graph_token() -> str:
    token = get_token_silent()
    if token:
        return token
    return get_token_interactive()
