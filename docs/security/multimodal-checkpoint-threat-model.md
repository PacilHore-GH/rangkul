# Multimodal Checkpoint Threat Model

Key risks are IDOR, non-consensual media, malicious files, prompt injection, model poisoning, sensitive export, insider abuse, face-data misuse, embedding leakage, replayed uploads, and duplicate jobs.

Controls include object-level authorization, 404 on unauthorized sensitive records, consent snapshots, private object storage, presigned URLs, MIME sniffing, malware scanning, FFmpeg resource limits, no raw media in logs, no identity embeddings, idempotency keys, queue step identities, redacted structured logging, and professional approval before family-visible final reports.
