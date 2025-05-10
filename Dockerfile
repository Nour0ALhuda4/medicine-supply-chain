# Use Node.js LTS as base image
FROM node:20-slim AS base
WORKDIR /usr/src/app

# Install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY package*.json /temp/dev/
RUN cd /temp/dev && npm install

# Install production dependencies
RUN mkdir -p /temp/prod
COPY package*.json /temp/prod/
RUN cd /temp/prod && npm install --production

# Build stage
FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Production stage
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/server ./server
COPY package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user and switch to it
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server/app.js"]
