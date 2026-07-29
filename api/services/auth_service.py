# services
from jose import JWTError
from jose.exceptions import ExpiredSignatureError
from jose import jwt
import os
import json

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_JWK = os.getenv("SUPABASE_JWK")

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
