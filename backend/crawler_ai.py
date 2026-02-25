import time
import re
import undetected_chromedriver as uc
from selenium_stealth import stealth
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

def scan_for_leaks(target):
    options = uc.ChromeOptions()
    options.add_argument("--headless") 
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-dev-shm-usage")

    driver = None
    try:
        # Self-healing version check for your Version 144
        try:
            driver = uc.Chrome(options=options, version_main=144, use_subprocess=True)
        except Exception:
            driver = uc.Chrome(options=options, use_subprocess=True)

        stealth(driver,
            languages=["en-US", "en"],
            vendor="Google Inc.",
            platform="Win32",
            webgl_vendor="Intel Inc.",
            renderer="Intel Iris OpenGL Engine",
            fix_hairline=True,
        )

        driver.get("https://www.google.com")
        time.sleep(2)

        search_query = f'"{target}" (leak OR breach OR dump OR "index of")'
        search_box = driver.find_element(By.NAME, "q")
        search_box.send_keys(search_query)
        search_box.send_keys(Keys.ENTER)

        time.sleep(4)

        # Target actual result links
        links = driver.find_elements(By.CSS_SELECTOR, "div.g a")
        for link in links:
            href = link.get_attribute("href")
            if href and "google.com" not in href and "https" in href:
                return {"found": True, "source": href, "score": 95}
        
        return {"found": False, "source": None, "score": 0}

    except Exception as e:
        print(f"❌ Selenium Error: {e}")
        return {"found": False, "source": None, "score": 0}
    finally:
        if driver:
            driver.quit()
