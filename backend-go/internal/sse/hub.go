package sse

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// Hub manages SSE clients
type Hub struct {
	mu      sync.RWMutex
	clients map[chan string]struct{}
}

// NewHub creates a new SSE Hub
func NewHub() *Hub {
	return &Hub{
		clients: make(map[chan string]struct{}),
	}
}

// Subscribe adds a new SSE client and returns its channel
func (h *Hub) Subscribe() chan string {
	ch := make(chan string, 10)
	h.mu.Lock()
	h.clients[ch] = struct{}{}
	h.mu.Unlock()
	return ch
}

// Unsubscribe removes a client
func (h *Hub) Unsubscribe(ch chan string) {
	h.mu.Lock()
	delete(h.clients, ch)
	close(ch)
	h.mu.Unlock()
}

// Broadcast sends an event to all connected clients
func (h *Hub) Broadcast(event string, data interface{}) {
	payload, err := json.Marshal(data)
	if err != nil {
		return
	}
	msg := fmt.Sprintf("event: %s\ndata: %s\n\n", event, string(payload))

	h.mu.RLock()
	defer h.mu.RUnlock()
	for ch := range h.clients {
		select {
		case ch <- msg:
		default:
			// client too slow, skip
		}
	}
}

// ServeHTTP handles SSE connections
func (h *Hub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	ch := h.Subscribe()
	defer h.Unsubscribe(ch)

	// Send ping immediately to confirm connection
	fmt.Fprintf(w, "event: connected\ndata: {\"status\":\"ok\"}\n\n")
	flusher.Flush()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				return
			}
			fmt.Fprint(w, msg)
			flusher.Flush()
		case <-ticker.C:
			// heartbeat
			fmt.Fprintf(w, ": ping\n\n")
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}
