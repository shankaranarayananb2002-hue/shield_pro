import time
import asyncio
import datetime
from concurrent.futures import ThreadPoolExecutor
from backend.databases import get_targets_collection, get_alerts_collection
from backend.crawler_ai import scan_for_leaks

# Thread pool: Selenium is synchronous so we run it in a thread
executor = ThreadPoolExecutor(max_workers=2)

# ── How long (seconds) before we re-scan a SECURE target ──
SECURE_RESCAN_HOURS = 24
SCAN_ERROR_RETRY_HOURS = 1


def _should_scan(target: dict) -> bool:
    """Returns True if this target is due for a scan."""
    status = target.get("status", "PENDING")

    # Always scan PENDING targets immediately
    if status in ("PENDING", "LEAKED"):
        return True

    last_scan_str = target.get("last_scan")
    if not last_scan_str or last_scan_str == "Awaiting...":
        return True

    try:
        last_scan_dt = datetime.datetime.strptime(last_scan_str, "%a %b %d %H:%M:%S %Y")
        elapsed_hours = (datetime.datetime.now() - last_scan_dt).total_seconds() / 3600

        if status == "SECURE" and elapsed_hours < SECURE_RESCAN_HOURS:
            return False
        if status == "SCAN_ERROR" and elapsed_hours < SCAN_ERROR_RETRY_HOURS:
            return False
    except Exception:
        return True  # if we can't parse, just scan

    return True


async def monitor_loop():
    print("🛡️ SHIELD WATCHDOG: Global Forensic Mode Active...")
    targets_col = get_targets_collection()
    alerts_col = get_alerts_collection()

    while True:
        targets = list(targets_col.find({}))
        scannable = [t for t in targets if _should_scan(t)]

        if not scannable:
            print(f"⏳ All targets up-to-date. Next check in 60s...")
        else:
            print(f"\n🔭 [{len(scannable)}/{len(targets)}] targets queued for forensic scan")

        for t in scannable:
            query_target = t.get("email") or t.get("value")
            if not query_target:
                continue

            print(f"\n🔍 [SCAN] Target: {query_target}")

            try:
                loop = asyncio.get_running_loop()
                report = await loop.run_in_executor(executor, scan_for_leaks, query_target)

                if report and report.get("found"):
                    source_site = report.get("source", "Unknown Source")
                    score = report.get("score", 90)
                    title = report.get("title", "Untitled")
                    method = report.get("method", "UNKNOWN")

                    print(f"🚨 [CRITICAL] Exposure confirmed via {method}")
                    print(f"   Source  : {source_site}")
                    print(f"   Evidence: {title}")
                    print(f"   Score   : {score}%")

                    # ── Save to Alerts Collection ──
                    alerts_col.update_one(
                        {"target": query_target},
                        {"$set": {
                            "target": query_target,
                            "timestamp": time.ctime(),
                            "evidence_url": source_site,
                            "evidence_title": title,
                            "detection_method": method,
                            "status": "CRITICAL"
                        }},
                        upsert=True
                    )

                    # ── Update Target Record ──
                    targets_col.update_one(
                        {"_id": t["_id"]},
                        {"$set": {
                            "status": "LEAKED",
                            "risk_score": score,
                            "source_url": source_site,
                            "evidence_title": title,
                            "last_scan": time.ctime()
                        }}
                    )

                else:
                    # Clean result — update status & timestamp to avoid rescanning
                    targets_col.update_one(
                        {"_id": t["_id"]},
                        {"$set": {
                            "status": "SECURE",
                            "risk_score": 0,
                            "last_scan": time.ctime()
                        }}
                    )
                    print(f"✅ [CLEAN] {query_target} — No exposure found")

            except Exception as e:
                print(f"❌ [WATCHDOG ERROR] {query_target}: {e}")
                targets_col.update_one(
                    {"_id": t["_id"]},
                    {"$set": {"status": "SCAN_ERROR", "last_scan": time.ctime()}}
                )

        print(f"\n⏲️  Cycle complete. Next scan in 60s...\n{'─'*50}")
        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(monitor_loop())
