#database.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

#Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    raise EnvironmentError("One or more Supabase environment variables are missing.")

#Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

#saving a session
def save_session(user_id:str,session:SessionCreate)->dict:
    new_row = {'user_id':user_id,
                'name':session_name,
                'dataset_ref':session.dataset_ref,
                'parameters':session.parameters,
                'results':session.results}
    supabase.table('sessions_table').insert(new_row)
    return new_row

