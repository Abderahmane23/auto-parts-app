FROM node:20-bullseye-slim

WORKDIR /app

# Install dependencies for Sharp if needed (glibc is standard in bullseye, so usually fine)
# RUN apt-get update && apt-get install -y ...

COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Define environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Start the server
CMD ["npm", "start"]
