import time
import re
import urllib.request
import urllib.parse
import json
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ─────────────────────────────────────────────
#  KNOWN BREACH / PASTE SITES — precision dorking
# ─────────────────────────────────────────────
BREACH_SITES = [
    "site:pastebin.com",
    "site:ghostbin.com",
    "site:hastebin.com",
    "site:rentry.co",
    "site:paste.ee",
    "site:justpaste.it",
    "site:controlc.com",
]

BREACH_KEYWORDS = ["leak", "breach", "dump", "combo", "database", "password", "credentials"]

# ─────────────────────────────────────────────
#  SOURCE 1: HIBP Free Pastes API (no key needed)
# ─────────────────────────────────────────────
def check_hibp_pastes(email: str) -> dict:
    """
    Checks the HaveIBeenPwned pastes API (free, no key required).
    Returns breach info if found.
    """
    try:
        encoded = urllib.parse.quote(email)
        url = f"https://haveibeenpwned.com/api/v3/pasteaccount/{encoded}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "SHIELD-Forensic-Engine/2.0 (Security Research)",
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode())
                if data:
                    paste = data[0]
                    source_url = paste.get("Source", "Unknown Paste Site")
                    paste_id = paste.get("Id", "")
                    return {
                        "found": True,
                        "source": f"https://pastebin.com/{paste_id}" if source_url == "Pastebin" else source_url,
                        "title": paste.get("Title") or "Untitled Paste Dump",
                        "date": paste.get("Date", "Unknown"),
                        "count": len(data),
                        "score": min(40 + (len(data) * 10), 95),
                        "method": "HIBP_PASTE"
                    }
        return {"found": False, "score": 0}
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return {"found": False, "score": 0}  # Clean — not found
        print(f"   [HIBP] HTTP Error: {e.code}")
        return {"found": False, "score": 0}
    except Exception as e:
        print(f"   [HIBP] Error: {e}")
        return {"found": False, "score": 0}


# ─────────────────────────────────────────────
#  SOURCE 2: Precision Google-Dork Scraper
#  Only flags if the target email is found
#  IN the actual page content — no false positives
# ─────────────────────────────────────────────
def _build_chrome_driver() -> uc.Chrome:
    """Creates a fresh undetected Chrome instance every call."""
    options = uc.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,800")
    options.add_argument("--log-level=3")
    options.add_argument("--silent")
    try:
        return uc.Chrome(options=options, version_main=144, use_subprocess=True)
    except Exception:
        options2 = uc.ChromeOptions()
        options2.add_argument("--headless=new")
        options2.add_argument("--no-sandbox")
        options2.add_argument("--disable-gpu")
        options2.add_argument("--disable-dev-shm-usage")
        return uc.Chrome(options=options2, use_subprocess=True)


def dork_breach_sites(target: str) -> dict:
    """
    Searches paste/breach sites specifically for the target.
    Validates page content actually contains the target before flagging.
    """
    driver = None
    try:
        driver = _build_chrome_driver()

        for site_filter in BREACH_SITES:
            # Build a tight dork query
            query = f'"{target}" {site_filter}'
            encoded_query = urllib.parse.quote(query)
            driver.get(f"https://www.google.com/search?q={encoded_query}&num=5")
            time.sleep(3)

            # Check if Google blocked us
            if "unusual traffic" in driver.page_source.lower():
                print("   [DORK] Google CAPTCHA detected — skipping dork phase")
                break

            # Extract result links
            links = driver.find_elements(By.CSS_SELECTOR, "div.g a[href]")
            result_urls = []
            for link in links:
                href = link.get_attribute("href")
                if href and "google.com" not in href and href.startswith("http"):
                    result_urls.append(href)

            # Validate: visit the page and confirm target appears in content
            for url in result_urls[:2]:  # only check top 2 results
                try:
                    driver.get(url)
                    time.sleep(2)
                    page_text = driver.find_element(By.TAG_NAME, "body").text
                    if target.lower() in page_text.lower():
                        return {
                            "found": True,
                            "source": url,
                            "title": driver.title or url,
                            "date": "Unknown",
                            "count": 1,
                            "score": 88,
                            "method": "DORK_VERIFIED"
                        }
                except Exception:
                    continue

            time.sleep(2)  # be polite between dork queries

        return {"found": False, "score": 0}

    except Exception as e:
        print(f"   [DORK] Engine Error: {e}")
        return {"found": False, "score": 0}
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass


# ─────────────────────────────────────────────
#  MASTER SCAN FUNCTION (called by watchdog)
# ─────────────────────────────────────────────
def scan_for_leaks(target: str) -> dict:
    """
    Multi-source forensic scan. Returns structured result dict.
    Priority: HIBP Pastes → Google Dork (verified)
    """
    print(f"   [ENGINE] Starting multi-source scan for: {target}")

    # ── Source 1: HIBP Paste API (fast, accurate, free) ──
    is_email = "@" in target and "." in target
    if is_email:
        print(f"   [SOURCE 1] Querying HIBP Paste Database...")
        hibp_result = check_hibp_pastes(target)
        if hibp_result.get("found"):
            print(f"   ✅ [HIBP] Paste exposure confirmed: {hibp_result['source']}")
            return hibp_result
        else:
            print(f"   [HIBP] No paste exposure found")

    # ── Source 2: Precision Google Dork (content-verified) ──
    print(f"   [SOURCE 2] Running precision site-dork scan...")
    dork_result = dork_breach_sites(target)
    if dork_result.get("found"):
        print(f"   ✅ [DORK] Verified exposure found: {dork_result['source']}")
        return dork_result

    print(f"   ✅ [CLEAN] No exposure found for: {target}")
    return {"found": False, "source": None, "score": 0, "method": "CLEAN"}
