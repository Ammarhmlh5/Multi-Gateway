export interface TelecomGateway {
  id: string;
  name: string;
  slug: string;
  provider: string;
  api_key: string;
  created_at: string;
}

export interface InternalRoute {
  id: string;
  name: string;
  slug: string;
  telecom_gateway_id: string;
  telecom_gateway_name: string;
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
  total_telecom_gateways: number;
  total_internal_routes: number;
  total_logs: number;
}

export interface LoginResponse {
  token: string;
}
