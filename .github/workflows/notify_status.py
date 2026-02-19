import os
import json
import requests

def check_status_and_notify():
    webhook_url = os.getenv("DISCORD_WEBHOOK")
    # Hent event-data fra GitHub Actions
    event_data = json.loads(os.getenv("PROJECT_DATA", "{}"))

    # Vi kigger efter ændringer i "Status" feltet
    changes = event_data.get("changes", {})
    field_value = event_data.get("project_item", {}).get("field_value", {})
    
    # Tjek om det er status-feltet (dette navn kan variere alt efter dit board)
    field_name = changes.get("field_configuration", {}).get("name")

    if field_name == "Status":
        # Foretrækker at hente den nye status fra 'changes' objektet for eksplicitte redigeringer.
        # Dette er mere robust, da det direkte afspejler, hvad der blev ændret.
        new_status = changes.get("field_value", {}).get("after", {}).get("name")
        
        # Fallback: Hvis 'after' ikke er tilgængelig (f.eks. for nogle 'moved' events
        # eller hvis strukturen er anderledes), hent den aktuelle status fra project_item selv.
        if not new_status:
            new_status = event_data.get("project_item", {}).get("field_value", {}).get("name")

        item_title = event_data.get("project_item", {}).get("content_title")
        
        # Send kun besked hvis status er 'Done'
        if new_status == "Review":
            msg = {
                "content": f"✅ **Opgave er til Review!**\n'{item_title}' Skal kigges på af nogen @here."
            }
            requests.post(webhook_url, json=msg)

        elif new_status == "Final Review":
            msg = {
                "content": f"✅ **Opgave er til Final Review!**\n'{item_title}' Skal kigges efter af alle @everyone."
            }
            requests.post(webhook_url, json=msg)

if __name__ == "__main__":
    check_status_and_notify()