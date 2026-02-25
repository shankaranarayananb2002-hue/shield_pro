import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from databases import get_targets_collection, get_alerts_collection
from crawler_ai import scan_for_leaks

# Create a thread pool to handle the blocking Selenium crawler
executor = ThreadPoolExecutor(max_workers=1)

async def monitor_loop():
    print("🛡️ SHIELD WATCHDOG: Global Forensic Mode Active...")
    targets_col = get_targets_collection()
    alerts_col = get_alerts_collection()

    while True:
        targets = list(targets_col.find())
        
        for t in targets:
            query_target = t['email']
            print(f"🔍 [GLOBAL SEARCH] Analyzing: {query_target}...")
            
            try:
                # CRITICAL FIX: Run the synchronous crawler in the executor
                loop = asyncio.get_event_loop()
                # We do NOT use 'await scan_for_leaks' directly
                report = await loop.run_in_executor(executor, scan_for_leaks, query_target)
                
                if report and report.get("found"):
                    source_site = report.get("source", "Deep Web Archive")
                    print(f"🚨 ALERT! Match found on: {source_site}")
                    
                    # Update Alerts
                    alerts_col.insert_one({
                        "target": query_target, 
                        "timestamp": time.ctime(),
                        "evidence_url": source_site,
                        "status": "CRITICAL"
                    })
                    
                    # Update Targets
                    targets_col.update_one(
                        {"_id": t["_id"]}, 
                        {"$set": {"status": "LEAKED", "source_url": source_site, "last_scan": time.ctime()}}
                    )
                else:
                    targets_col.update_one(
                        {"_id": t["_id"]}, 
                        {"$set": {"status": "SECURE", "last_scan": time.ctime()}}
                    )
                    print(f"✅ [CLEAN] No global exposure for {query_target}")

            except Exception as e:
                print(f"❌ Forensic Loop Error: {e}")

        print(f"⏲️ Scan Cycle Complete. Waiting 60s...")
        await asyncio.sleep(60) 

if __name__ == "__main__":
    asyncio.run(monitor_loop())
