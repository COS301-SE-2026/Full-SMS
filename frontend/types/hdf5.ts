import { StringifyOptions } from "querystring";

export interface InitUploadResponse {
  upload_id: string;
  storage_key: string;
  upload_url: {signed_url: string};
  url_expires_at: string;
  max_file_size_bytes: number;
};

export interface UploadRecord{
  id: string,
  user_id: string,
  filename: string,
  storage_key: string,
  content_type: string | null,
  size_bytes: number,
  sha256: string,
  status: string,
  error_code: string | null,
  erorr_message: string | null,
  created_at: string,
  updated_at: string,
  parsed_at: string
}

export interface Measurement {
  name: string;
  checked: boolean;
  expanded?: boolean;
  channels?: string[];
}