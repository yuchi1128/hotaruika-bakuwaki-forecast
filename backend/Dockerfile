# --- ビルダーステージ ---
# ビルド用のベースイメージ
FROM golang:1.24-alpine AS builder

# ca-certificatesとtzdataをインストール
RUN apk --no-cache add ca-certificates tzdata

# ワーキングディレクトリを設定
WORKDIR /app

# 依存関係のファイルをコピー
COPY go.mod go.sum ./
# 依存関係をダウンロード
RUN go mod download

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
# CGO_ENABLED=0 は静的リンクバイナリを生成し、scratchイメージなどの軽量イメージで動作しやすく
# -o /app/server で出力先を指定
RUN CGO_ENABLED=0 go build -o /app/server main.go

# --- 本番ステージ ---
# 実行用の非常に軽量なベースイメージ
FROM scratch

# ワーキングディレクトリを設定
WORKDIR /app

# ビルダーステージから証明書とタイムゾーン情報をコピー
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# ビルダーステージからコンパイル済みのバイナリのみをコピー
COPY --from=builder /app/server .

# ポートを公開
EXPOSE 8080

# アプリケーションを実行
CMD ["/app/server"]