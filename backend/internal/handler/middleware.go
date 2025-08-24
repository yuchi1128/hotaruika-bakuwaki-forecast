//backend/internal/handler/middleware.go
package handler

import (
	"net/http"

	"github.com/yuchi1128/hotaruika-bakuwaki-forecast/backend/internal/model"
	"github.com/golang-jwt/jwt/v5"
)

func (h *Handler) authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("admin_token")
		if err != nil {
			http.Error(w, "認証されていません", http.StatusUnauthorized)
			return
		}
		tokenString := cookie.Value
		claims := &model.Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return h.jwtKey, nil
		})
		if err != nil || !token.Valid || claims.Role != "admin" {
			http.Error(w, "トークンまたはロールが不正です", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	}
}