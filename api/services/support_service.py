
import os
from dotenv import load_dotenv
import resend as mail

#Load environment variables from .env file
load_dotenv()

RESEND_API = os.getenv('RESEND_API_KEY')
mail.api_key = RESEND_API

def send_email(user_email:str, message:str)->dict:
    result = mail.Emails.send({
        "from": "onboarding@resend.dev",
        "to": "coretech.capstone@gmail.com",
        "subject": "Help Request FULLSMS",
        "html": f"<p>User email: {user_email}</p><p>Message: {message}</p>"
    })
    return result