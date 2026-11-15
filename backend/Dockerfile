# ==========================================
# Stage 1: Build the Rust binary
# ==========================================
FROM rust:bookworm AS builder

WORKDIR /usr/src/backend

# Copy source code and build release binary
COPY Cargo.toml Cargo.lock* ./
COPY src ./src

RUN cargo build --release

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
