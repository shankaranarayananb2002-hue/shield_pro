import time
from colorama import Fore, Back, Style, init
from backend.databases import get_alerts_collection

init(autoreset=True)

def show_war_room():
    alerts_col = get_alerts_collection()
    
 
    print(Fore.RED + Style.BRIGHT + """
    ##################################################
    ##        SHIELD GLOBAL THREAT DETECTOR         ##
    ##        SURVEILLANCE MODE: ACTIVE             ##
    ##################################################
    """)
    print(Fore.CYAN + "Scanning Global Indices for Data Leaks...\n")

    
    seen_alerts = set()

    ignored_sources = [
        "google.com/intl",
        "about/products",
        "None",
        "google.co.in",
        "accounts.google.com"
    ]

    while True:
        try:
           
            alerts = list(alerts_col.find())
            
            for a in alerts:
                
                target = a.get('target') or a.get('email') or 'Unknown Entity'
                timestamp = a.get('timestamp') or a.get('time') or 'N/A'
                source = str(a.get('evidence_url') or a.get('source'))
                alert_id = str(a.get('_id'))

                if alert_id not in seen_alerts:
                   
                    if not any(ignored in source for ignored in ignored_sources):
                        print(Back.RED + Fore.WHITE + Style.BRIGHT + f" 🚨 CRITICAL LEAK DETECTED ")
                        print(Fore.WHITE + f" 🎯 TARGET : {target}")
                        print(Fore.WHITE + f" 📅 CLOCK  : {timestamp}")
                        print(Fore.YELLOW + Style.BRIGHT + f" 📍 SOURCE : {source}")
                        print(Fore.RED + "━" * 50)
                    
                    
                    seen_alerts.add(alert_id)
        
        except Exception as e:
            print(Fore.MAGENTA + f"[SYSTEM_ERROR] Analysis interrupted: {e}")

        time.sleep(2) 

if __name__ == "__main__":
    try:
        show_war_room()
    except KeyboardInterrupt:
        print(Fore.YELLOW + "\n[SYSTEM] War Room standing down. Surveillance paused.")
