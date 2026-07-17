from celery import Celery

from app.core.config import settings

celery_app = Celery("rangkul_checkpoints", broker=settings.CELERY_BROKER_URL, backend=settings.CELERY_RESULT_BACKEND)
celery_app.conf.task_routes = {
    "checkpoint.cpu.*": {"queue": "checkpoint.cpu"},
    "checkpoint.gpu.*": {"queue": "checkpoint.gpu"},
    "checkpoint.io.*": {"queue": "checkpoint.io"},
    "checkpoint.retention.*": {"queue": "checkpoint.retention"},
}
celery_app.conf.task_default_queue = "checkpoint.cpu"
celery_app.conf.task_always_eager = settings.CELERY_TASK_ALWAYS_EAGER
celery_app.conf.task_eager_propagates = settings.CELERY_TASK_EAGER_PROPAGATES
celery_app.autodiscover_tasks(["app.development_checkpoints.infrastructure.queue"])
