What the upload_service.py file does:
user uploads file
uppload_service.py grabs it
creates a unique name
saves it to /tmp/sms_uploads/ on the server
tells the rest of the app where it saved it

Install the following:
 pip install fastapi httpx pytest-asyncio
 pip install pytest-asyncio
 pytest api/tests/test_upload_service.py -v
