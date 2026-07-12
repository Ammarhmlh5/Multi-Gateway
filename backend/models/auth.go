package models

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type StatsResponse struct {
	TotalTelecomGateways int `json:"total_telecom_gateways"`
	TotalInternalRoutes int `json:"total_internal_routes"`
	TotalLogs            int `json:"total_logs"`
}
