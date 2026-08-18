# services
import httpx
from jose import JWTError
from jose.exceptions import ExpiredSignatureError
from jose import jwt
import os
import json
from api.models.user import OneDriveCode
from api.utils.supabase_client import supabaseClient
from dotenv import load_dotenv

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_JWK = os.getenv("SUPABASE_JWK")
ONEDRIVE_CLIENT_ID = os.getenv("ONEDRIVE_CLIENT_ID")
ONEDRIVE_CLIENT_SECRET= os.getenv("ONEDRIVE_CLIENT_SECRET")
ONEDRIVE_REDIRECT_URI=os.getenv("ONEDRIVE_REDIRECT_URI")
ALLOWED_ALGORITHMS = ["HS256", "ES256"]


def verify_token(token: str) -> dict:
    """
    Returns the decoded payload if valid.
    Raises ValueError with a descriptive message if invalid.
    """
    try:
        if SUPABASE_JWK:
            try:
                jwk_data = json.loads(SUPABASE_JWK)
                public_key = jwk_data["keys"][0]

                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["ES256"],
                    options={"verify_aud": False},
                )
                return payload
            except JWTError:
                pass

        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            return payload
        raise RuntimeError("No JWT verification credentials configured")

    except ExpiredSignatureError:
        raise ValueError("Token has expired")

    except JWTError:
        raise ValueError("Invalid token")

    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")


def link_onedrive(payload: OneDriveCode, user_id: str):
    token_response = httpx.post(
        "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
        data={
            "client_id": ONEDRIVE_CLIENT_ID,
            "client_secret": ONEDRIVE_CLIENT_SECRET,
            "code": payload.code,
            "redirect_uri": ONEDRIVE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
    )
    
    if token_response.status_code !=200:
        print(token_response.text)
        raise Exception
    
    tokens = token_response.json()
    refresh_token = tokens.get("refresh_token")
    
    supabaseClient.table("user_integrations").upsert({
        "user_id": user_id,
        "provider": "onedrive",
        "refresh_token": refresh_token
    }, on_conflict="user_id,provider",).execute()
    
    return {"status":"success"}