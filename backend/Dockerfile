FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py migrate
RUN python manage.py shell -c "from apps.services.views import seed_default_topology; seed_default_topology()"

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
