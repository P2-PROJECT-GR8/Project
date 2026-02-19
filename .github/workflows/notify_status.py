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
        new_status = field_value.get("name") # F.eks. "Done" eller "In Progress"
        item_title = event_data.get("project_item", {}).get("content_title")
        
        # Send kun besked hvis status er 'Done'
        if new_status == "Done":
            msg = {
                "content": f"✅ **Opgave fuldført!**\n'{item_title}' er nu flyttet til **Done**."
            }
            requests.post(webhook_url, json=msg)

if __name__ == "__main__":
    check_status_and_notify()