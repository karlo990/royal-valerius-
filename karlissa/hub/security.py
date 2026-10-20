"""Passwords, phone numbers, tokens and sign-in rate limits."""
from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import threading
import time
from collections import defaultdict, deque

ITERATIONS = 240_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored or not password:
        return False
    try:
        _, iters, salt, digest = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(iters))
        return hmac.compare_digest(dk.hex(), digest)
    except (ValueError, TypeError):
        return False


def new_token() -> str:
    return secrets.token_urlsafe(32)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def norm_phone(raw: str | None) -> str:
    """Normalise to international digits: 0771 234 567, +263 77 123 4567 and 263771234567 all
    become 263771234567. Numbers written with + or 00 keep their own country code (diaspora parents)."""
    s = (raw or "").strip()
    digits = re.sub(r"\D", "", s)
    if not digits:
        return ""
    if s.startswith("+"):
        return digits
    if digits.startswith("00"):
        return digits[2:]
    if digits.startswith("263"):
        return digits
    if digits.startswith("0") and len(digits) == 10:
        return "263" + digits[1:]
    if len(digits) == 9 and digits[0] == "7":
        return "263" + digits
    return digits


def phones_match(typed: str, stored: str) -> bool:
    a, b = norm_phone(typed), norm_phone(stored)
    if not a or not b:
        return False
    return hmac.compare_digest(a, b) or (len(a) >= 9 and len(b) >= 9 and hmac.compare_digest(a[-9:], b[-9:]))


def pretty_phone(n: str) -> str:
    n = norm_phone(n)
    if n.startswith("263") and len(n) == 12:
        return f"+263 {n[3:5]} {n[5:8]} {n[8:]}"
    return f"+{n}" if n else ""


def mask_phone(n: str) -> str:
    p = pretty_phone(n)
    return (p[:7] + "*** " + p[-3:]) if len(p) > 10 else p


def norm_adm(raw: str | None) -> str:
    return re.sub(r"\s", "", raw or "").upper()


class RateLimiter:
    """At most `limit` failed attempts per key in `window` seconds."""

    def __init__(self, limit: int, window: int):
        self.limit, self.window = limit, window
        self.hits: dict[str, deque] = defaultdict(deque)
        self.lock = threading.Lock()

    def _trim(self, key: str, now: float) -> deque:
        q = self.hits[key]
        while q and now - q[0] > self.window:
            q.popleft()
        return q

    def blocked(self, key: str) -> int:
        """Seconds until the key may try again (0 = allowed)."""
        now = time.time()
        with self.lock:
            q = self._trim(key, now)
            return int(self.window - (now - q[0])) + 1 if len(q) >= self.limit else 0

    def fail(self, key: str) -> None:
        with self.lock:
            self._trim(key, time.time()).append(time.time())

    def clear(self, key: str) -> None:
        with self.lock:
            self.hits.pop(key, None)


LOGIN_BY_ID = RateLimiter(limit=6, window=15 * 60)
LOGIN_BY_IP = RateLimiter(limit=30, window=15 * 60)
REGISTER_BY_IP = RateLimiter(limit=8, window=60 * 60)
