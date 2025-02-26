📜 README.md for Discord RP Ticket Bot
md
Copy
Edit
# 🎫 Discord RP Ticket Bot

A **Discord Ticket Bot** designed for **Roleplay Servers**. This bot allows users to create support tickets with categories, assign staff, and generate transcripts.

---

## 🚀 Features

- **Custom Ticket Panel** with categories  
- **Role-based Permissions** (Only Admins can close tickets)  
- **Ticket Transcripts** (Saved in a log channel)  
- **Staff Assignment System** (Assign support staff to tickets)  
- **Reopen & Close Tickets** with embed messages  
- **Fully Embedded Messages** for a professional look  

---

## 🛠️ Installation

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/SrivatsaMG/Discord-Rp-ticketbot.git
cd Discord-Rp-ticketbot
2️⃣ Install Dependencies
sh
Copy
Edit
npm install
3️⃣ Configure Environment Variables
Create a .env file in the project directory and add the following:

ini
Copy
Edit
TOKEN=your_bot_token
ClientID=your_client_id
GuildID=your_guild_id

ServerName=Your Server Name
ServerLogo=https://yourlogo.png
Thumbnail=https://yourthumbnail.png
Image=https://yourimage.png

AdminRoleID=YOUR_ADMIN_ROLE_ID
TicketSetUpChannel=YOUR_TICKET_SETUP_CHANNEL_ID
TranscriptChannelID=YOUR_TRANSCRIPT_CHANNEL_ID
TicketCategoryID=YOUR_TICKET_CATEGORY_ID
4️⃣ Run the Bot
sh
Copy
Edit
node index.js
🎮 Commands
Command	Description
/setupticket	Setup the ticket panel in a channel
Click "Create Ticket"	Opens a support ticket
Close Ticket	Closes the ticket (Admin only)
Reopen Ticket	Reopens a closed ticket
Assign Staff	Assigns a support staff to a ticket
Transcript Ticket	Saves a transcript of the ticket
📜 Example Embedded Panel
markdown
Copy
Edit
🎫 **Support Ticket Panel**
-----------------------------------
📌 **Select a category:**
- 💰 Billing
- 🛠️ Technical Support
- ❓ General Inquiry

✅ Click "Create Ticket" to open a new ticket.
🔒 Close Ticket | 👤 Assign Staff | 📜 Transcript
