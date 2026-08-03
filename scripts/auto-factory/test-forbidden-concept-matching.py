from __future__ import annotations

import re


def normalized(value: str) -> str:
    value = (
        value.lower()
        .replace("ı", "i")
        .replace("ğ", "g")
        .replace("ü", "u")
        .replace("ş", "s")
        .replace("ö", "o")
        .replace("ç", "c")
    )
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def contains_complete_phrase(text: str, phrase: str) -> bool:
    haystack = normalized(text)
    needle = normalized(phrase)
    return bool(needle) and f" {needle} " in f" {haystack} "


# Regression from run 30858491037: the valid microbiology phrase below must not
# be rejected merely because a forbidden two-word concept contains "space".
assert not contains_complete_phrase("empty competition space", "space rocket")
assert contains_complete_phrase("a space rocket beside the colony", "space rocket")
assert not contains_complete_phrase("currency exchange network", "currency chart")
assert contains_complete_phrase("a currency chart appears", "currency chart")

print("Forbidden concept phrase regression: PASS")
