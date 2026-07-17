ARG PYTHON_IMAGE=python:3.11-slim-bookworm
FROM ${PYTHON_IMAGE}

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_NO_CACHE_DIR=1

# Set working directory
WORKDIR /code

# All current runtime dependencies provide prebuilt wheels. Avoiding
# build-essential removes a large layer and makes a cold build much faster.
COPY ./requirements.txt /code/requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade -r /code/requirements.txt

# Copy backend application source code
COPY ./app /code/app
COPY ./alembic /code/alembic
COPY ./alembic.ini /code/alembic.ini

# Expose port 8000
EXPOSE 8000

# Railway injects PORT at runtime; retain 8000 for local Docker usage.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
