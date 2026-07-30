
import os
from dotenv import load_dotenv
from email.mime.text import MIMEText
import smtplib

#Load environment variables from .env file
load_dotenv()

GMAIL_ADDRESS=os.getenv('GMAIL_ADDRESS')
GMAIL_PASSWORD=os.getenv('GMAIL_PASSWORD')


def send_email(user_email:str, message:str)->dict:
    message_body = f"<p>User email: {user_email}</p><p>Message: {message}</p>"
    message = MIMEText(message_body, "html")
    message["Subject"] = "FULLSMS Help Request"
    message["From"] = GMAIL_ADDRESS
    message["To"] = "coretech.capstone@gmail.com"

    with smtplib.SMTP_SSL("smtp.gmail.com",465) as message_server:
        message_server.login(GMAIL_ADDRESS, GMAIL_PASSWORD)
        message_server.send_message(message)
        return{"status":"ticket sent"}
    