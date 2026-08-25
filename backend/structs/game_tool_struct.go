package structs

type CreateGameToolRequest struct {
	Name              string `json:"name" binding:"required"`
	Slug              string `json:"slug"`
	GameCode          string `json:"game_code" binding:"required"`
	IconURL           string `json:"icon_url"`
	Description       string `json:"description"`
	Category          string `json:"category"`
	UserIdLabel       string `json:"user_id_label"`
	UserIdPlaceholder string `json:"user_id_placeholder"`
	HasZoneId         bool   `json:"has_zone_id"`
	ZoneIdLabel       string `json:"zone_id_label"`
	ZoneIdPlaceholder string `json:"zone_id_placeholder"`
	HasServerList     bool   `json:"has_server_list"`
	ServerOptions     string `json:"server_options"`
	GuideText         string `json:"guide_text"`
	IsActive          *bool  `json:"is_active"`
	SortOrder         int    `json:"sort_order"`
}

type UpdateGameToolRequest struct {
	Name              string `json:"name"`
	Slug              string `json:"slug"`
	GameCode          string `json:"game_code"`
	IconURL           string `json:"icon_url"`
	Description       string `json:"description"`
	Category          string `json:"category"`
	UserIdLabel       string `json:"user_id_label"`
	UserIdPlaceholder string `json:"user_id_placeholder"`
	HasZoneId         *bool  `json:"has_zone_id"`
	ZoneIdLabel       string `json:"zone_id_label"`
	ZoneIdPlaceholder string `json:"zone_id_placeholder"`
	HasServerList     *bool  `json:"has_server_list"`
	ServerOptions     string `json:"server_options"`
	GuideText         string `json:"guide_text"`
	IsActive          *bool  `json:"is_active"`
	SortOrder         *int   `json:"sort_order"`
}

type GameCheckQuery struct {
	GameCode string `form:"game_code" binding:"required"`
	UserId   string `form:"user_id" binding:"required"`
	ZoneId   string `form:"zone_id"`
}

type GameCheckResponse struct {
	GameCode string `json:"game_code"`
	GameName string `json:"game_name,omitempty"`
	UserId   string `json:"user_id"`
	ZoneId   string `json:"zone_id,omitempty"`
	Nickname string `json:"nickname"`
}

type UpdateToolSettingRequest struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	ToolType    string `json:"tool_type"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Icon        string `json:"icon"`
	IsEnabled   *bool  `json:"is_enabled"`
	IsPopular   *bool  `json:"is_popular"`
	Badge       string `json:"badge"`
	BadgeColor  string `json:"badge_color"`
	SortOrder   *int   `json:"sort_order"`
}
