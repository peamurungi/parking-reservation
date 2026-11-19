"""Task 4: Django checks the Supabase access token, then looks up the role."""
import uuid

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from .models import Profile

_jwks = None


class SupabaseUser:
    is_authenticated = True

    def __init__(self, user_id, role):
        self.id = user_id
        self.role = role


def decode_token(token):
    """Verify signature + expiry. Supports the legacy shared secret (HS256)
    and Supabase's newer signing keys (published at the project's JWKS URL)."""
    global _jwks
    if settings.SUPABASE_JWT_SECRET:
        return jwt.decode(token, settings.SUPABASE_JWT_SECRET,
                          algorithms=["HS256"], audience="authenticated")
    if _jwks is None:
        _jwks = jwt.PyJWKClient(settings.SUPABASE_URL + "/auth/v1/.well-known/jwks.json")
    key = _jwks.get_signing_key_from_jwt(token).key
    return jwt.decode(token, key, algorithms=["ES256", "RS256"], audience="authenticated")


class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if len(parts) != 2 or parts[0].lower() != b"bearer":
            return None  # no token -> 401 from the permission check
        try:
            claims = decode_token(parts[1].decode())
            user_id = uuid.UUID(claims["sub"])
        except Exception as e:
            raise AuthenticationFailed("Invalid or expired token")
        # the user id comes from the VERIFIED token, never from the request body
        profile = Profile.objects.filter(user_id=user_id).first()
        return SupabaseUser(user_id, profile.role if profile else "driver"), None

    def authenticate_header(self, request):
        return "Bearer"
