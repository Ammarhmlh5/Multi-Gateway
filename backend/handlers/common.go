package handlers

import (
	"fmt"
	"regexp"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9_]+$`)

// RouteLogTableName converts an internal route slug into the strict dynamic
// table name: route_<slug>_logs.
func RouteLogTableName(slug string) string {
	return fmt.Sprintf("route_%s_logs", slug)
}

// ValidateSlug checks that a slug is non-empty, 80 chars or fewer, and
// contains only lowercase letters, digits, and underscores.
func ValidateSlug(slug string) error {
	if slug == "" {
		return fmt.Errorf("slug is required")
	}
	if len(slug) > 80 {
		return fmt.Errorf("slug must be 80 characters or fewer")
	}
	if !slugPattern.MatchString(slug) {
		return fmt.Errorf("slug must contain only lowercase letters, numbers, and underscores")
	}
	return nil
}
