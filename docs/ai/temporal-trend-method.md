# Temporal Trend Method

Trend analysis compares only compatible checkpoints: same template, modality, preprocessing schema, and model revision. The transparent automated labels are `observed_positive_trend`, `stable_observation`, `needs_professional_review`, and `insufficient_data`.

The MVP threshold is conservative: fewer than five valid checkpoints or average quality below `0.60` yields `insufficient_data`. No modality distances are combined into a single opaque score.
