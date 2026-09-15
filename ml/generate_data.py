import pandas as pd
import random

categories = ["Network", "Hardware", "Software", "Accounts", "Academic", "Hostel", "Transport", "Other"]

templates = {
    "Network": ["The wi-fi in {place} is not working", "I cannot connect to the internet in {place}", "Network is very slow in {place}"],
    "Hardware": ["The {device} in {place} is broken", "My {device} won't turn on", "{device} is making a weird noise"],
    "Software": ["{app} is crashing on my computer", "I cannot install {app}", "Need a license for {app}"],
    "Accounts": ["My scholarship amount is not credited", "Need help with fee payment", "Incorrect fee showing in my account"],
    "Academic": ["My grades are not updated", "Need help with course registration", "Clash in exam schedule"],
    "Hostel": ["No water in {place}", "Fan is not working in {place}", "Room needs cleaning"],
    "Transport": ["Bus {bus_no} was late today", "Need a bus pass", "Bus {bus_no} is very crowded"],
    "Other": ["I lost my ID card", "Where is the cafeteria?", "Need to contact the admin"]
}

places = ["lab 1", "lab 2", "library", "hostel block A", "hostel block B", "main building"]
devices = ["monitor", "keyboard", "mouse", "printer", "projector"]
apps = ["MATLAB", "AutoCAD", "Visual Studio", "MS Office"]
buses = ["10", "12", "15", "22"]

def generate_ticket(category):
    template = random.choice(templates[category])
    text = template.format(
        place=random.choice(places),
        device=random.choice(devices),
        app=random.choice(apps),
        bus_no=random.choice(buses)
    )
    return text

data = []
for _ in range(500):
    cat = random.choice(categories)
    text = generate_ticket(cat)
    data.append({"text": text, "category": cat})

df = pd.DataFrame(data)
df.to_csv("tickets.csv", index=False)
print("Generated tickets.csv with 500 samples.")
