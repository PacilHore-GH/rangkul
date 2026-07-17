from app.ai_runtime.protocols import GeneratedReport


FORBIDDEN_REPORT_TERMS = ["diagnosis", "normal", "abnormal", "caused by", "disebabkan oleh rekomendasi"]


class SafeDraftReportGenerator:
    def validate_language(self, report: GeneratedReport) -> None:
        text = " ".join(
            [
                report.headline,
                *report.observation_summary,
                *report.positive_observations,
                *report.items_for_professional_review,
                report.adherence_summary,
                report.data_quality_summary,
                *report.limitations,
            ]
        ).lower()
        for term in FORBIDDEN_REPORT_TERMS:
            if term in text:
                raise ValueError(f"Unsafe clinical or causal wording detected: {term}")

    def generate_sync(self, payload: dict) -> GeneratedReport:
        report = GeneratedReport(
            headline="Draf observasi checkpoint siap ditinjau",
            observation_summary=[
                f"Checkpoint {payload.get('checkpoint_template', 'unknown')} telah dianalisis dari metrik terstruktur.",
                "Hasil ini hanya menjelaskan observasi yang terlihat dan bukan kesimpulan medis.",
            ],
            positive_observations=["Data yang memenuhi ambang kualitas dipertahankan untuk tinjauan profesional."],
            items_for_professional_review=["Tinjau kesesuaian observasi dengan target rekomendasi profesional."],
            adherence_summary="Kepatuhan hanya diringkas berdasarkan checkpoint yang tersedia dalam periode rekomendasi.",
            data_quality_summary="Keterbatasan kamera, audio, pencahayaan, dan kualitas data harus dipertimbangkan.",
            limitations=["Persetujuan profesional diperlukan sebelum ringkasan dibagikan sebagai hasil akhir."],
            suggested_review_questions=["Apakah observasi ini sesuai dengan target yang didefinisikan profesional?"],
            automated_trend_language="insufficient_data",
        )
        self.validate_language(report)
        return report
