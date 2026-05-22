# services
from jose import JWTError
from jose.exceptions import ExpiredSignatureError
from jose import jwt, jwk
from jose.backends import ECKey
import os
import json

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_JWK = os.getenv("SUPABASE_JWK")


def verify_token(token: str) -> dict:
    """
    Returns the decoded payload if valid.
    Raises ValueError with a descriptive message if invalid.
    """
    try:
        # Decode without verification first to check the algorithm
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get("alg", "HS256")

        # Handle ES256 tokens with JWK
        if algorithm == "ES256":
            if not SUPABASE_JWK:
                raise RuntimeError(
                    "SUPABASE_JWK is not set for ES256 verification")

            jwk_data = json.loads(SUPABASE_JWK)
            # Get the first key from the keys array
            public_key = jwk_data["keys"][0]

            # Verify the token using JWK
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                options={"verify_aud": False, "verify_signature": True},
            )
        else:
            # Handle HS256 tokens with secret
            if not SUPABASE_JWT_SECRET:
                raise RuntimeError(
                    "SUPABASE_JWT_SECRET is not set for HS256 verification")

            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False, "verify_signature": True},
            )

        return payload

    except ExpiredSignatureError:
        raise ValueError("Token has expired")

    except JWTError:
        raise ValueError("Invalid token")

    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")
