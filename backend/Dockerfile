# Base image
FROM golang:1.24-alpine

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum
COPY go.* ./

# Download dependencies
RUN go mod download

# Copy the rest of the application code
COPY . .

# Build the Go application
# Expose the port the app runs on
EXPOSE 8080

# Command to start the application
CMD ["go", "run", "main.go"]
