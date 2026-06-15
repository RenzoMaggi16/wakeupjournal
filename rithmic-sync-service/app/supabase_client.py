from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client with the SERVICE ROLE KEY
# This client has admin privileges and bypasses RLS policies.
# NEVER expose this client to the frontend.
supabase_client: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)
