# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# Expose the port the app runs on
EXPOSE 3000

# Command to start the application
CMD ["npm", "run", "dev"]
