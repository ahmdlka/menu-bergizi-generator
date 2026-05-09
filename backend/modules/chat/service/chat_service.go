package service

import (
	"encoding/json"
	"math"

	"github.com/Mobilizes/materi-be-alpro/database/entities"
	"github.com/Mobilizes/materi-be-alpro/modules/chat/dto"
	"github.com/Mobilizes/materi-be-alpro/modules/chat/repository"
	mpRepo "github.com/Mobilizes/materi-be-alpro/modules/meal_plan/repository"
	userRepo "github.com/Mobilizes/materi-be-alpro/modules/user/repository"
	"github.com/Mobilizes/materi-be-alpro/pkg/ragclient"
	"github.com/google/uuid"
)

type ChatService struct {
	repo          *repository.ChatRepository
	intentService *IntentService
	mpRepo        *mpRepo.MealPlanRepository
	userRepo      *userRepo.UserRepository
	ragClient     *ragclient.RAGClient
}

func NewChatService(
	repo *repository.ChatRepository,
	intentService *IntentService,
	mpRepo *mpRepo.MealPlanRepository,
	userRepo *userRepo.UserRepository,
	ragClient *ragclient.RAGClient,
) *ChatService {
	return &ChatService{
		repo:          repo,
		intentService: intentService,
		mpRepo:        mpRepo,
		userRepo:      userRepo,
		ragClient:     ragClient,
	}
}

// computeDailyNutrition menghitung ulang daily_nutrition tiap hari
// berdasarkan penjumlahan nutrition_summary dari setiap meal.
func (s *ChatService) computeDailyNutrition(planData entities.PlanData) entities.PlanData {
	// Marshal ke raw map agar bisa dimanipulasi secara dinamis
	raw, err := json.Marshal(planData)
	if err != nil {
		return planData
	}

	var plan map[string]interface{}
	if err := json.Unmarshal(raw, &plan); err != nil {
		return planData
	}

	days, ok := plan["days"].([]interface{})
	if !ok {
		return planData
	}

	for _, d := range days {
		day, ok := d.(map[string]interface{})
		if !ok {
			continue
		}

		meals, ok := day["meals"].([]interface{})
		if !ok {
			continue
		}

		var totalCalories, totalProtein, totalCarbs, totalFat float64

		for _, m := range meals {
			meal, ok := m.(map[string]interface{})
			if !ok {
				continue
			}

			nutrition, ok := meal["nutrition_summary"].(map[string]interface{})
			if !ok {
				continue
			}

			totalCalories += toFloat64(nutrition["calories"])
			totalProtein += toFloat64(nutrition["protein"])
			totalCarbs += toFloat64(nutrition["carbs"])
			totalFat += toFloat64(nutrition["fat"])
		}

		day["daily_nutrition"] = map[string]interface{}{
			"calories": round2(totalCalories),
			"protein":  round2(totalProtein),
			"carbs":    round2(totalCarbs),
			"fat":      round2(totalFat),
		}
	}

	// Marshal kembali ke entities.PlanData
	result, err := json.Marshal(plan)
	if err != nil {
		return planData
	}

	var updatedPlan entities.PlanData
	if err := json.Unmarshal(result, &updatedPlan); err != nil {
		return planData
	}

	return updatedPlan
}

// toFloat64 safely converts interface{} ke float64
func toFloat64(v interface{}) float64 {
	if v == nil {
		return 0
	}
	switch val := v.(type) {
	case float64:
		return val
	case float32:
		return float64(val)
	case int:
		return float64(val)
	case int64:
		return float64(val)
	case json.Number:
		f, _ := val.Float64()
		return f
	}
	return 0
}

// round2 membulatkan ke 2 angka desimal
func round2(val float64) float64 {
	return math.Round(val*100) / 100
}

func (s *ChatService) ProcessMessage(userID uuid.UUID, req *dto.ChatRequest) (*dto.ChatResponse, error) {
	// 1. Identify Intent
	intent := s.intentService.Classify(req.Message, req.MealPlanID)

	// 2. Get User Profile for Context
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	userProfile := map[string]interface{}{
		"age":              user.Profile.Age,
		"weight_kg":        user.Profile.WeightKg,
		"height_cm":        user.Profile.HeightCm,
		"gender":           user.Profile.Gender,
		"activity_level":   user.Profile.ActivityLevel,
		"goal":             user.Profile.Goal,
		"allergies":        user.Profile.Allergies,
		"diseases":         user.Profile.Diseases,
		"food_preferences": user.Profile.FoodPreferences,
	}

	// 3. Fetch Meal Plan Context if ID provided
	var plan *entities.MealPlan
	if req.MealPlanID != nil && *req.MealPlanID != uuid.Nil {
		p, err := s.mpRepo.FindByID(*req.MealPlanID)
		if err == nil {
			plan = p
		}
	}

	// 4. Save User Message to History
	s.repo.Create(&entities.ChatHistory{
		UserID:     userID,
		MealPlanID: req.MealPlanID,
		Role:       "user",
		Message:    req.Message,
		Intent:     intent,
	})

	var response dto.ChatResponse
	response.Intent = intent

	// 5. Prepare Payload & Call RAG
	ragPayload := map[string]interface{}{
		"user_profile": userProfile,
	}
	if plan != nil {
		ragPayload["meal_plan"] = plan.PlanData
	}

	if intent == IntentRefineMenu && plan != nil {
		// REFINE_MENU Logic
		ragPayload["instruction"] = req.Message

		ragRes, err := s.ragClient.Refine(ragPayload)
		if err != nil {
			return nil, err
		}

		updatedPlan := s.computeDailyNutrition(ragRes)
		newVersion := plan.Version + 1

		// Update MealPlan
		plan.PlanData = updatedPlan
		plan.Version = newVersion
		s.mpRepo.Update(plan)

		// Create Version History
		s.mpRepo.CreateVersion(&entities.MealPlanVersion{
			MealPlanID: plan.ID.String(),
			Version:    newVersion,
			PlanData:   updatedPlan,
			ChangeNote: req.Message,
		})

		response.Reply = "Saya telah memperbarui meal plan Anda sesuai instruksi."

		var fullPlan entities.FullPlanData
		bytes, _ := json.Marshal(updatedPlan)
		json.Unmarshal(bytes, &fullPlan)

		response.UpdatedMealPlan = fullPlan
		response.NewVersion = newVersion

	} else {
		// ASK_QUESTION Logic
		ragPayload["question"] = req.Message

		ragRes, err := s.ragClient.Ask(ragPayload)
		if err != nil {
			return nil, err
		}

		if reply, ok := ragRes["reply"].(string); ok {
			response.Reply = reply
		} else if reply, ok := ragRes["data"].(string); ok {
			response.Reply = reply
		} else {
			bytes, _ := json.Marshal(ragRes)
			response.Reply = string(bytes)
		}
	}

	// 6. Save Assistant Reply to History
	s.repo.Create(&entities.ChatHistory{
		UserID:     userID,
		MealPlanID: req.MealPlanID,
		Role:       "assistant",
		Message:    response.Reply,
		Intent:     intent,
	})

	return &response, nil
}

func (s *ChatService) GetHistory(userID uuid.UUID) ([]dto.ChatHistoryResponse, error) {
	history, err := s.repo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	var res []dto.ChatHistoryResponse
	for _, h := range history {
		res = append(res, dto.ChatHistoryResponse{
			ID:         h.ID,
			MealPlanID: h.MealPlanID,
			Role:       h.Role,
			Message:    h.Message,
			Intent:     h.Intent,
			CreatedAt:  h.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return res, nil
}
