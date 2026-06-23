# DemoSpoofDetection

Web demo phát hiện giọng AI sử dụng **MoLEx** (model mới) và **AASIST** (baseline) — cả hai được train trên ASVspoof5.

## Kiến trúc

```
Browser  →  Next.js (Vercel)  →  Spring Boot (Railway)  →  Modal GPU (T4)
                                        ↓                    ↑
                                   Neon PostgreSQL      MoLEx + AASIST
```

## Cấu trúc

| Thư mục | Mô tả |
|---------|-------|
| `frontend/` | Next.js 14 + TypeScript + Tailwind |
| `backend/` | Java 21 + Spring Boot 3.3 + Maven |
| `inference/` | Python + Modal (GPU inference) |

## Chạy local

### 1. Modal Inference

```bash
pip install modal
modal token new
modal volume create spoof-detection-models
bash inference/upload_checkpoints.sh
modal deploy inference/modal_app.py
```

### 2. Backend

```bash
cd backend
export DATABASE_URL="jdbc:postgresql://..."
export DATABASE_USERNAME="..."
export DATABASE_PASSWORD="..."
export MODAL_INFERENCE_URL="https://..."
export CORS_ALLOWED_ORIGINS="http://localhost:3000"
mvn spring-boot:run
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Mở http://localhost:3000

## Models

| Model | Size | Vai trò |
|-------|------|---------|
| MoLEx | 1.4 GB | Primary — model mới phát triển |
| AASIST | 1.3 MB | Secondary — baseline so sánh |

Cả hai được train trên ASVspoof5 với sample rate 16kHz, segment 64600 samples (~4s).

## Deploy

Xem chi tiết tại `stuff/claude_plans/code_demo_spoof_detection_web.md` — mục 9.
