# services
from jose import JWTError
from jose.exceptions import ExpiredSignatureError
from jose import jwt
import os

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
JWT_ALGORITHM = "HS256"

def verify_token(token: str) -> dict:
    """
    Returns the decoded payload if valid.
    Raises ValueError with a descriptive message if invalid.
    """
    if not SUPABASE_JWT_SECRET:
        raise RuntimeError("SUPABASE_JWT_SECRET is not set in environment variables")
    
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False},
        )
        return payload
    
    except ExpiredSignatureError:
        raise ValueError("Token has expired")

    except JWTError:
        raise ValueError("Invalid token")

    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")
