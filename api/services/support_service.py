import os
from dotenv import load_dotenv
from email.mime.text import MIMEText
import smtplib

from fastapi import HTTPException

#Load environment variables from .env file
load_dotenv()

GMAIL_ADDRESS = os.getenv('GMAIL_ADDRESS')
GMAIL_PASSWORD = os.getenv('GMAIL_PASSWORD')


def send_email(user_email: str, message: str) -> dict:
    if not GMAIL_ADDRESS or not GMAIL_PASSWORD:
        raise HTTPException(
            status_code=503,
            detail="Email service not configured. Please contact support directly at coretech.capstone@gmail.com"
        )

    message_body = f"<p>User email: {user_email}</p><p>Message: {message}</p>"
    email_message = MIMEText(message_body, "html")
    email_message["Subject"] = "FULLSMS Help Request"
    email_message["From"] = GMAIL_ADDRESS
    email_message["To"] = "coretech.capstone@gmail.com"

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as message_server:
            message_server.login(GMAIL_ADDRESS, GMAIL_PASSWORD)
            message_server.send_message(email_message)
            return {"status": "ticket sent"}
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
            status_code=503,
            detail="Email authentication failed. Please contact support directly at coretech.capstone@gmail.com"
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to send email: {str(e)}"
        )
    