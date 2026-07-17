# Checkpoint Architecture

Rangkul checkpoints are split into API orchestration, private media storage, queue jobs, model runtimes, structured results, temporal trend analysis, and professional review. The API accepts consented checkpoint creation, presigned upload lifecycle calls, submission, status retrieval, results, draft reports, and review decisions.

The runtime contract is interface-first: speech, face behavior, pose, motion embedding, segmentation, reference matching, trend, and report generation can be replaced without changing the API. Development uses deterministic fake analyzers. Production workers must preload required model assets and keep readiness false until required models are available.

Raw media and embeddings are not returned to the frontend by default and are never sent to Groq. Groq report payloads contain only structured observable metrics, aggregate quality metadata, trend summaries, and recommendation targets.
