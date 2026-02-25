import time
from colorama import Fore, Back, Style, init
from backend.databases import get_alerts_collection

# Initialize Colorama for the "War Room" colors
init(autoreset=True)

def show_war_room():
    alerts_col = get_alerts_collection()
    
    # ASCII Art Header for the 2099 Feel
    print(Fore.RED + Style.BRIGHT + """
    ##################################################
    ##        SHIELD GLOBAL THREAT DETECTOR         ##
    ##        SURVEILLANCE MODE: ACTIVE             ##
    ##################################################
    """)
    print(Fore.CYAN + "Scanning Global Indices for Data Leaks...\n")

    # Use a set to keep track of alerts we've already displayed this session
    seen_alerts = set()

    while True:
        try:
            # Check database for new alerts
            alerts = list(alerts_col.find())
            
            for a in alerts:
                # Forensic Key Mapping
                # 1. 'target' is the email/ID we scanned
                # 2. 'evidence_url' (or 'source') is the REAL web address found
                target = a.get('target') or a.get('email') or 'Unknown Entity'
                timestamp = a.get('timestamp') or a.get('time') or 'N/A'
                source = a.get('evidence_url') or a.get('source')
                alert_id = str(a.get('_id'))

                if alert_id not in seen_alerts:
                    print(Back.RED + Fore.WHITE + Style.BRIGHT + f" 🚨 CRITICAL LEAK DETECTED ")
                    print(Fore.WHITE + f" 🎯 TARGET : {target}")
                    print(Fore.WHITE + f" 📅 CLOCK  : {timestamp}")
                    
                    # Highlighting the actual leaked website address
                    print(Fore.YELLOW + Style.BRIGHT + f" 📍 SOURCE : {source}")
                    print(Fore.RED + "━" * 50)
                    
                    seen_alerts.add(alert_id)
        
        except Exception as e:
            print(Fore.MAGENTA + f"[SYSTEM_ERROR] Analysis interrupted: {e}")

        time.sleep(2) # Refresh cycle

if __name__ == "__main__":
    try:
        show_war_room()
    except KeyboardInterrupt:
        print(Fore.YELLOW + "\n[SYSTEM] War Room standing down. Surveillance paused.")
