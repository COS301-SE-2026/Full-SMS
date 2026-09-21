CREATE OR REPLACE FUNCTION public.get_workspaces_with_file_count(p_user_id uuid)

RETURNS TABLE(id uuid, name character varying, description text, storage_bucket_path text,
      status character varying, created_at timestamp with time zone, updated_at timestamp
      with time zone, file_count bigint)

LANGUAGE sql
AS $$
  SELECT 
    w.id,
    w.name,
    w.description,
    w.storage_bucket_path,
    w.status,
    w.created_at,
    w.updated_at,
    COUNT(f.id) AS file_count
  FROM public.workspaces w
  LEFT JOIN public.workspace_files f ON w.id = f.workspace_id
  WHERE w.user_id = p_user_id
  GROUP BY w.id;
$$;


