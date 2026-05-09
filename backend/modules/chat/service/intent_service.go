package service

import (
	"strings"

	"github.com/google/uuid"
)

const (
	IntentRefineMenu  = "REFINE_MENU"
	IntentAskQuestion = "ASK_QUESTION"
)

type IntentService struct{}

func NewIntentService() *IntentService {
	return &IntentService{}
}

func (s *IntentService) Classify(message string, mealPlanID *uuid.UUID) string {
	if mealPlanID == nil || *mealPlanID == uuid.Nil {
		return IntentAskQuestion
	}

	// Simple heuristic to distinguish between modification (Refine) and information (Ask)
	msg := strings.ToLower(message)
	keywords := []string{"ganti", "ubah", "tambah", "kurangi", "hapus", "update", "pindah", "set", "modify", "change", "replace"}

	for _, kw := range keywords {
		if strings.Contains(msg, kw) {
			return IntentRefineMenu
		}
	}

	return IntentAskQuestion
}
