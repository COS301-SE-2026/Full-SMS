# Install all requirements first by running the following command on your terminal, otherwise install individually:
pip install -r requirements.txt

# What the upload.py file does
receives a request to upload a file
hands it to the controller to handle the request
returns what the controller returns in a JSON format

# What the upload_controller.py does
checks if the file is allowed or has a valid file extension
tells the service to save it
then reports back what happened

# What the upload_service.py file does:
user uploads file
upload_service.py grabs it
creates a unique name
saves it to /tmp/sms_uploads/ on the server
tells the rest of the app where it saved it

# Running the unit tests
pytest api/tests/ -v