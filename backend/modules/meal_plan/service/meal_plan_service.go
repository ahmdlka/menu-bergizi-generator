package service

import (
	"encoding/json"
	"fmt"
	"math"

	"github.com/Mobilizes/materi-be-alpro/database/entities"
	"github.com/Mobilizes/materi-be-alpro/modules/meal_plan/dto"
	"github.com/Mobilizes/materi-be-alpro/modules/meal_plan/repository"
	userRepo "github.com/Mobilizes/materi-be-alpro/modules/user/repository"
	"github.com/Mobilizes/materi-be-alpro/pkg/ragclient"
	"github.com/google/uuid"
)

type MealPlanService struct {
	repo      *repository.MealPlanRepository
	userRepo  *userRepo.UserRepository
	ragClient *ragclient.RAGClient
}

func NewMealPlanService(repo *repository.MealPlanRepository, userRepo *userRepo.UserRepository, ragClient *ragclient.RAGClient) *MealPlanService {
	return &MealPlanService{
		repo:      repo,
		userRepo:  userRepo,
		ragClient: ragClient,
	}
}

// computeDailyNutrition menghitung ulang daily_nutrition tiap hari
// berdasarkan penjumlahan nutrition_summary dari setiap meal.
func (s *MealPlanService) computeDailyNutrition(planData entities.PlanData) entities.PlanData {
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

func (s *MealPlanService) Generate(userID uuid.UUID, req *dto.GenerateMealPlanRequest) (*dto.MealPlanResponse, error) {
	// 1. Get user profile
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	if user.Profile.UserID == "" {
		return nil, fmt.Errorf("user profile is incomplete, please update your profile first")
	}

	// 2. Prepare payload for RAG
	payload := map[string]interface{}{
		"user_profile": map[string]interface{}{
			"age":              user.Profile.Age,
			"weight_kg":        user.Profile.WeightKg,
			"height_cm":        user.Profile.HeightCm,
			"gender":           user.Profile.Gender,
			"activity_level":   user.Profile.ActivityLevel,
			"goal":             user.Profile.Goal,
			"allergies":        user.Profile.Allergies,
			"diseases":         user.Profile.Diseases,
			"food_preferences": user.Profile.FoodPreferences,
		},
		"constraints": map[string]interface{}{
			"duration_days":       req.DurationDays,
			"budget_per_day":      float64(user.Profile.BudgetPerDay),
			"exclude_ingredients": []string{},
			"prefer_local_food":   true,
		},
	}

	if req.ExtraConstraints != nil {
		constraints := payload["constraints"].(map[string]interface{})
		if req.ExtraConstraints.BudgetPerDay > 0 {
			constraints["budget_per_day"] = float64(req.ExtraConstraints.BudgetPerDay)
		}
		if len(req.ExtraConstraints.ExcludeIngredients) > 0 {
			constraints["exclude_ingredients"] = req.ExtraConstraints.ExcludeIngredients
		}
		constraints["prefer_local_food"] = req.ExtraConstraints.PreferLocalFood
	}

	// 3. Call RAG Service
	ragRes, err := s.ragClient.Generate(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to generate meal plan from AI: %w", err)
	}

	// The RAG service returns the meal plan directly, not wrapped in "data"
	planData := s.computeDailyNutrition(ragRes)

	// 4. Save to Database
	mealPlan := &entities.MealPlan{
		UserID:       userID.String(),
		Mode:         req.Mode,
		DurationDays: req.DurationDays,
		PlanData:     planData,
		Version:      1,
		IsActive:     true,
	}

	if err := s.repo.Create(mealPlan); err != nil {
		return nil, fmt.Errorf("failed to save meal plan: %w", err)
	}

	// 5. Save Version
	version := &entities.MealPlanVersion{
		MealPlanID: mealPlan.ID.String(),
		Version:    1,
		PlanData:   planData,
		ChangeNote: "Initial generation",
	}
	s.repo.CreateVersion(version)

	return s.mapToMealPlanResponse(mealPlan), nil
}

func (s *MealPlanService) GetByUserID(userID uuid.UUID) ([]dto.MealPlanResponse, error) {
	plans, err := s.repo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	var res []dto.MealPlanResponse
	for _, p := range plans {
		res = append(res, *s.mapToMealPlanResponse(&p))
	}
	return res, nil
}

func (s *MealPlanService) GetByID(id uuid.UUID) (*dto.MealPlanResponse, error) {
	plan, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	return s.mapToMealPlanResponse(plan), nil
}

func (s *MealPlanService) GetVersions(mealPlanID uuid.UUID) ([]dto.MealPlanVersionResponse, error) {
	versions, err := s.repo.FindVersionsByMealPlanID(mealPlanID)
	if err != nil {
		return nil, err
	}

	var res []dto.MealPlanVersionResponse
	for _, v := range versions {
		res = append(res, dto.MealPlanVersionResponse{
			ID:         v.ID,
			Version:    v.Version,
			PlanData:   s.convertToFullPlanData(v.PlanData),
			ChangeNote: v.ChangeNote,
			CreatedAt:  v.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return res, nil
}

func (s *MealPlanService) Delete(id uuid.UUID) error {
	return s.repo.Delete(id)
}

func (s *MealPlanService) mapToMealPlanResponse(p *entities.MealPlan) *dto.MealPlanResponse {
	return &dto.MealPlanResponse{
		ID:           p.ID,
		Mode:         p.Mode,
		Version:      p.Version,
		DurationDays: p.DurationDays,
		Plan:         s.convertToFullPlanData(p.PlanData),
		IsActive:     p.IsActive,
	}
}

func (s *MealPlanService) convertToFullPlanData(data entities.PlanData) entities.FullPlanData {
	var fullPlan entities.FullPlanData
	bytes, _ := json.Marshal(data)
	json.Unmarshal(bytes, &fullPlan)
	return fullPlan
}
