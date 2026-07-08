export interface Gateway {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  created_at: string;
}

export interface SMSLog {
  id: string;
  sender_id: string;
  receiver_phone: string;
  message_text: string;
  status: string;
  received_at: string;
}

export interface StatsResponse {
  total_gateways: number;
  total_logs: number;
}

export interface LoginResponse {
  token: string;
}

export interface ApiError {
  error: string;
}
