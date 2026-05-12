FROM python:3.11-slim

WORKDIR /app

# System dependencies for PyMuPDF and audio processing
RUN apt-get update && apt-get install -y \
    libmupdf-dev \
    libfreetype6-dev \
    libharfbuzz-dev \
    gcc \
    portaudio19-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

ENV FLASK_ENV=production
ENV PYTHON_PORT=5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]
