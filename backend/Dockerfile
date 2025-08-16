# --- ビルダーステージ ---
# ビルド用のベースイメージ
FROM golang:1.24-alpine AS builder

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

# ビルダーステージからコンパイル済みのバイナリのみをコピー
COPY --from=builder /app/server .

# 画像アップロード用のディレクトリをワーキングディレクトリ内に作成
# (Cloud Storage等を使わない場合)
COPY --from=builder /app/uploads ./uploads

# ポートを公開
EXPOSE 8080

# アプリケーションを実行
CMD ["/app/server"]