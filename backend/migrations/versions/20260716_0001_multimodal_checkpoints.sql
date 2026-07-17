CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS checkpoint_templates (
    id uuid PRIMARY KEY,
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    modality text NOT NULL,
    instruction_text text NOT NULL,
    instruction_version integer NOT NULL DEFAULT 1,
    expected_phases jsonb NOT NULL DEFAULT '[]',
    metric_schema jsonb NOT NULL DEFAULT '{}',
    quality_requirements jsonb NOT NULL DEFAULT '{}',
    default_reference_id uuid NULL,
    active boolean NOT NULL DEFAULT true,
    deleted_at timestamptz NULL,
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS professional_recommendations (
    id uuid PRIMARY KEY,
    person_profile_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    title text NOT NULL,
    rationale text NOT NULL,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NULL,
    frequency text NULL,
    status text NOT NULL DEFAULT 'active',
    review_date date NULL,
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendation_targets (
    id uuid PRIMARY KEY,
    recommendation_id uuid NOT NULL REFERENCES professional_recommendations(id),
    checkpoint_template_id uuid NOT NULL REFERENCES checkpoint_templates(id),
    expected_repetitions integer NULL,
    target_thresholds jsonb NOT NULL DEFAULT '{}',
    reference_version integer NULL,
    weight numeric NOT NULL DEFAULT 1.0,
    schedule_rule jsonb NOT NULL DEFAULT '{}',
    version integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS development_checkpoints (
    id uuid PRIMARY KEY,
    person_profile_id uuid NOT NULL,
    template_id uuid NOT NULL REFERENCES checkpoint_templates(id),
    recommendation_target_id uuid NULL REFERENCES recommendation_targets(id),
    captured_by_user_id uuid NULL,
    modality text NOT NULL,
    capture_mode text NOT NULL,
    capture_timestamp timestamptz NOT NULL,
    status text NOT NULL,
    raw_retention_mode text NOT NULL,
    consent_snapshot jsonb NOT NULL,
    overall_quality_status text NULL,
    processing_version integer NOT NULL DEFAULT 1,
    client_request_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,
    UNIQUE (person_profile_id, client_request_id)
);

CREATE TABLE IF NOT EXISTS checkpoint_analysis_results (
    id uuid PRIMARY KEY,
    checkpoint_id uuid NOT NULL REFERENCES development_checkpoints(id),
    processing_version integer NOT NULL,
    speech_embedding vector(1280) NULL,
    face_behavior_embedding vector(112) NULL,
    motion_embedding vector(512) NULL,
    metrics jsonb NOT NULL DEFAULT '{}',
    quality jsonb NOT NULL DEFAULT '{}',
    model_revisions jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (checkpoint_id, processing_version)
);

CREATE TABLE IF NOT EXISTS checkpoint_reviews (
    id uuid PRIMARY KEY,
    checkpoint_id uuid NOT NULL REFERENCES development_checkpoints(id),
    reviewer_id uuid NOT NULL,
    decision text NOT NULL,
    professional_notes text NULL,
    corrected_observations jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkpoint_processing_jobs (
    id uuid PRIMARY KEY,
    checkpoint_id uuid NOT NULL REFERENCES development_checkpoints(id),
    step text NOT NULL,
    status text NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    next_retry_at timestamptz NULL,
    redacted_error text NULL,
    idempotency_key text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_checkpoints_person_captured_at ON development_checkpoints(person_profile_id, capture_timestamp DESC);
CREATE INDEX IF NOT EXISTS ix_checkpoints_status ON development_checkpoints(status);
CREATE INDEX IF NOT EXISTS ix_jobs_state_retry ON checkpoint_processing_jobs(status, next_retry_at);
