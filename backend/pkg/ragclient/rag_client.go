package ragclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type RAGClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewRAGClient() *RAGClient {
	url := os.Getenv("RAG_SERVICE_URL")
	if url == "" {
		url = "http://localhost:8000"
	}
	return &RAGClient{
		BaseURL:    url,
		HTTPClient: &http.Client{Timeout: 300 * time.Second},
	}
}

func (c *RAGClient) post(endpoint string, payload interface{}) (map[string]interface{}, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	resp, err := c.HTTPClient.Post(c.BaseURL+endpoint, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("rag request error: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("rag service error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var rawResult interface{}
	if err := json.Unmarshal(respBody, &rawResult); err != nil {
		// If it's not JSON, check if it's the Ask endpoint which can return plain text
		if endpoint == "/rag/ask" {
			return map[string]interface{}{"data": string(respBody), "reply": string(respBody)}, nil
		}
		return nil, fmt.Errorf("rag decode error: %w (body: %s)", err, string(respBody))
	}

	// Handle different response types (Object or String)
	switch v := rawResult.(type) {
	case map[string]interface{}:
		return v, nil
	case string:
		return map[string]interface{}{"data": v, "reply": v}, nil
	default:
		// Fallback for other types
		return map[string]interface{}{"data": v}, nil
	}
}

func (c *RAGClient) Generate(payload map[string]interface{}) (map[string]interface{}, error) {
	return c.post("/rag/generate", payload)
}

func (c *RAGClient) Refine(payload map[string]interface{}) (map[string]interface{}, error) {
	return c.post("/rag/refine", payload)
}

func (c *RAGClient) Ask(payload map[string]interface{}) (map[string]interface{}, error) {
	return c.post("/rag/ask", payload)
}
