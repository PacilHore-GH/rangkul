from app.ai_runtime.protocols import TrendResult
from app.development_checkpoints.domain.enums import TrendStatus


def analyze_trend(valid_checkpoints: int, average_quality: float) -> TrendResult:
    if valid_checkpoints < 5 or average_quality < 0.60:
        return TrendResult(
            status=TrendStatus.INSUFFICIENT_DATA,
            valid_checkpoints=valid_checkpoints,
            average_quality=average_quality,
            limitations=["Minimum 5 valid checkpoints and average quality 0.60 are required."],
        )
    return TrendResult(
        status=TrendStatus.STABLE_OBSERVATION,
        valid_checkpoints=valid_checkpoints,
        average_quality=average_quality,
        limitations=[],
    )
