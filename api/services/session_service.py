#database.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from models.session import SessionCreate

#Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    raise EnvironmentError("One or more Supabase environment variables are missing.")

#Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

#saving a session by inserting a row into a sessions table
def save_session(user_id:str,session:SessionCreate)->dict:
    new_row = {'user_id':user_id,
                'name':session.name,
                'dataset_ref':session.dataset_ref,
                'parameters':session.parameters,
                'results':session.results}
    response = supabase.table('sessions_table').insert(new_row).execute()
    return response.data[0]


#retrieving all sessions for a user
def get_sessions(user_id:str)->list:
    response = supabase.table('sessions_table').select('*').eq('user_id',user_id).execute()
    return response.data

#retrieving a specific session of a particular user
def get_session_by_id(session_id:str,user_id:str)->dict:
    response = supabase.table('sessions_table').select('*').eq('id',session_id).eq('user_id',user_id).execute()
    return response.data[0]











#helpful examples from a yt video
#inserting a new row into a table
#new_row = {'firstName:' 'John Doe'}
#supabase.table('demoTable').insert(new_row).execute()

#updating an entry/value in a row
#new_row = {'firstName:''Jane Doe'}
#supabase.table('demoTable').update(new_row).eq('id',1).execute()

#deleting a record from the table
#supabase.table('demoTable').delete().eq('id',1).execute()

#selecting all rows
#results = supabase.table('demoTable').select('*').execute()
#print(results)
