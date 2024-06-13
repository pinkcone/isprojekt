from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from decouple import config
from fastapi import HTTPException, Request
from urllib.parse import parse_qs
from typing import Union
import json
import urllib.parse


JWT_SECRET = config("JWT_SECRET")
JWT_ALGORITHM = config("JWT_ALGORITHM")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_jwt_token(payload: dict):
    """
    Create JWT token with user ID and role. Token expires in 7 days by default.
    It needs the payload you want to write.
    """

    encoded_jwt = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def encrypt_password(password: str):
    """
    Encrypt a plain password using bcrypt.
    """
    return pwd_context.hash(password)


def check_password(plain_password: str, hashed_password: str):
    """
    Verify a plain password against the hashed version.
    """
    return pwd_context.verify(plain_password, hashed_password)


def check_token(token: str):
    """
    Check if the JWT token is valid.
    """
    try:
        _ = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return True
    except jwt.PyJWTError:
        return False


async def read_token_from_header(request: Request) -> dict:
    """
    Checks if the token received in the Header of an http request is valid.
    It will raise an HTTPException with an appropriate status_code if it isn't.
    Otherwise it will return the token's payload.
    """

    authorization: str = request.headers.get("Authorization")

    if authorization is None:
        raise HTTPException(status_code=422, detail="Missing 'Authorization' header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid 'Authorization' header")

    token = authorization.split(" ")[1]

    if not check_token(token):
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        # Decode the token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def read_token(token: str) -> dict:
    """
    Checks if the string token in input is valid.
    It will raise an HTTPException with an appropriate status_code if it isn't.
    Otherwise it will return the token's payload.
    """
    if not check_token(token):
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        # Decode the token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
