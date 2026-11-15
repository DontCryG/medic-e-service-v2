# ==========================================
# Stage 1: Build the Rust binary
# ==========================================
FROM rust:1.85-bookworm AS builder

WORKDIR /usr/src/backend

# Copy manifests to cache dependencies
COPY Cargo.toml Cargo.lock* ./

# Dummy build to cache compiled crates
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Copy source code and build final binary
COPY src ./src
RUN touch src/main.rs && cargo build --release

# ==========================================
# Stage 2: Minimal runtime environment
# ==========================================
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Bangkok
ENV PORT=3001

WORKDIR /app
COPY --from=builder /usr/src/backend/target/release/backend /app/backend

EXPOSE 3001

CMD ["/app/backend"]
