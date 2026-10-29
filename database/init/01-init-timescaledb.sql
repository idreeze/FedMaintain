-- ============================================================================
-- FedMaintain Database Initialization
-- TimescaleDB-compatible PostgreSQL setup for semiconductor equipment telemetry
-- and Predictive Maintenance ML / Federated Learning Foundations
-- ============================================================================

-- Ensure TimescaleDB extension is enabled
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Ensure UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Phase 4: High-frequency sensor readings hypertable
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_readings (
    time TIMESTAMPTZ NOT NULL,
    sensor_id BIGINT NOT NULL,
    machine_id BIGINT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    quality VARCHAR(20) NOT NULL DEFAULT 'GOOD'
);

SELECT create_hypertable('sensor_readings', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_time 
    ON sensor_readings (sensor_id, time DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_machine_time 
    ON sensor_readings (machine_id, time DESC);

-- ----------------------------------------------------------------------------
-- Phase 5: Machine Healthy Baselines & Preprocessed Sliding-Window Features
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_baselines (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL,
    baseline_temperature DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    baseline_vibration DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    baseline_current DOUBLE PRECISION NOT NULL DEFAULT 16.0,
    baseline_pressure DOUBLE PRECISION NOT NULL DEFAULT 45.0,
    baseline_rpm DOUBLE PRECISION NOT NULL DEFAULT 1800.0,
    baseline_acoustic DOUBLE PRECISION NOT NULL DEFAULT 52.0,
    sample_count INT NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_machine_baseline_machine UNIQUE (machine_id)
);

CREATE TABLE IF NOT EXISTS machine_features (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    -- Temperature Features
    temperature_mean DOUBLE PRECISION,
    temperature_std DOUBLE PRECISION,
    temperature_min DOUBLE PRECISION,
    temperature_max DOUBLE PRECISION,
    temperature_range DOUBLE PRECISION,
    temperature_trend DOUBLE PRECISION,
    temperature_deviation_pct DOUBLE PRECISION,
    -- Vibration Features
    vibration_mean DOUBLE PRECISION,
    vibration_std DOUBLE PRECISION,
    vibration_min DOUBLE PRECISION,
    vibration_max DOUBLE PRECISION,
    vibration_range DOUBLE PRECISION,
    vibration_rms DOUBLE PRECISION,
    vibration_trend DOUBLE PRECISION,
    vibration_deviation_pct DOUBLE PRECISION,
    -- Current Features
    current_mean DOUBLE PRECISION,
    current_std DOUBLE PRECISION,
    current_min DOUBLE PRECISION,
    current_max DOUBLE PRECISION,
    current_range DOUBLE PRECISION,
    current_trend DOUBLE PRECISION,
    current_deviation_pct DOUBLE PRECISION,
    -- Pressure Features
    pressure_mean DOUBLE PRECISION,
    pressure_std DOUBLE PRECISION,
    pressure_min DOUBLE PRECISION,
    pressure_max DOUBLE PRECISION,
    pressure_trend DOUBLE PRECISION,
    -- RPM Features
    rpm_mean DOUBLE PRECISION,
    rpm_std DOUBLE PRECISION,
    rpm_min DOUBLE PRECISION,
    rpm_max DOUBLE PRECISION,
    rpm_trend DOUBLE PRECISION,
    -- Acoustic Features
    acoustic_mean DOUBLE PRECISION,
    acoustic_std DOUBLE PRECISION,
    acoustic_max DOUBLE PRECISION,
    acoustic_trend DOUBLE PRECISION,
    -- Quality Metadata
    data_quality VARCHAR(20) NOT NULL DEFAULT 'GOOD',
    reading_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_machine_window UNIQUE (machine_id, window_start, window_end)
);

CREATE INDEX IF NOT EXISTS idx_machine_features_machine_window 
    ON machine_features (machine_id, window_start DESC);

-- ----------------------------------------------------------------------------
-- Phase 6: Machine Degradation Runs, RUL Training Dataset, Models & Predictions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machine_runs (
    id BIGSERIAL PRIMARY KEY,
    run_id VARCHAR(64) UNIQUE NOT NULL,
    machine_id BIGINT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    failure_timestamp TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'RUNNING',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ml_training_datasets (
    id BIGSERIAL PRIMARY KEY,
    dataset_version VARCHAR(50) UNIQUE NOT NULL,
    dataset_type VARCHAR(50) NOT NULL DEFAULT 'RUL_SUPERVISED',
    feature_schema_version VARCHAR(30) NOT NULL DEFAULT 'v1',
    machine_count INT NOT NULL DEFAULT 0,
    sample_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rul_training_samples (
    id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT NOT NULL,
    machine_id BIGINT NOT NULL,
    run_id VARCHAR(64) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    -- Engineered Features snapshot
    temperature_mean DOUBLE PRECISION,
    temperature_std DOUBLE PRECISION,
    temperature_max DOUBLE PRECISION,
    temperature_trend DOUBLE PRECISION,
    temperature_deviation_pct DOUBLE PRECISION,
    vibration_mean DOUBLE PRECISION,
    vibration_std DOUBLE PRECISION,
    vibration_rms DOUBLE PRECISION,
    vibration_trend DOUBLE PRECISION,
    vibration_deviation_pct DOUBLE PRECISION,
    current_mean DOUBLE PRECISION,
    current_std DOUBLE PRECISION,
    current_trend DOUBLE PRECISION,
    current_deviation_pct DOUBLE PRECISION,
    pressure_mean DOUBLE PRECISION,
    pressure_trend DOUBLE PRECISION,
    rpm_mean DOUBLE PRECISION,
    rpm_trend DOUBLE PRECISION,
    acoustic_mean DOUBLE PRECISION,
    acoustic_trend DOUBLE PRECISION,
    -- Supervised Ground Truth Target
    rul_hours DOUBLE PRECISION NOT NULL,
    data_quality VARCHAR(20) NOT NULL DEFAULT 'GOOD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rul_samples_dataset_run 
    ON rul_training_samples (dataset_id, run_id);

CREATE TABLE IF NOT EXISTS model_versions (
    id BIGSERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) UNIQUE NOT NULL,
    model_type VARCHAR(50) NOT NULL DEFAULT 'REGRESSION',
    algorithm VARCHAR(50) NOT NULL,
    feature_schema_version VARCHAR(30) NOT NULL DEFAULT 'v1',
    training_dataset_version VARCHAR(50),
    training_started_at TIMESTAMPTZ,
    training_completed_at TIMESTAMPTZ,
    mae DOUBLE PRECISION,
    rmse DOUBLE PRECISION,
    r2 DOUBLE PRECISION,
    training_samples INT DEFAULT 0,
    test_samples INT DEFAULT 0,
    artifact_path VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'TRAINING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rul_predictions (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL,
    model_version_id BIGINT,
    prediction_time TIMESTAMPTZ NOT NULL,
    rul_hours DOUBLE PRECISION NOT NULL,
    data_quality VARCHAR(20) NOT NULL DEFAULT 'GOOD',
    status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rul_predictions_machine_time 
    ON rul_predictions (machine_id, prediction_time DESC);

-- ----------------------------------------------------------------------------
-- Phase 7: Explainability Engine & Predictive Maintenance Alerts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prediction_explanations (
    id BIGSERIAL PRIMARY KEY,
    prediction_id BIGINT NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_value DOUBLE PRECISION NOT NULL,
    baseline_value DOUBLE PRECISION NOT NULL,
    deviation_percentage DOUBLE PRECISION NOT NULL,
    contribution_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
    direction VARCHAR(20) NOT NULL DEFAULT 'NEUTRAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pred_explanations_pred_id 
    ON prediction_explanations (prediction_id);

CREATE TABLE IF NOT EXISTS maintenance_alerts (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL,
    prediction_id BIGINT,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    trigger_value DOUBLE PRECISION,
    threshold_value DOUBLE PRECISION,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(100),
    resolved_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_alerts_machine_status 
    ON maintenance_alerts (machine_id, status);

CREATE INDEX IF NOT EXISTS idx_maintenance_alerts_type_status 
    ON maintenance_alerts (alert_type, status);

-- ----------------------------------------------------------------------------
-- Phase 8: Federated Learning Clients, Rounds, Updates & Global Models
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS federated_clients (
    id BIGSERIAL PRIMARY KEY,
    client_id VARCHAR(64) UNIQUE NOT NULL,
    plant_id BIGINT,
    plant_code VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    dataset_size INT NOT NULL DEFAULT 0,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS federated_rounds (
    id BIGSERIAL PRIMARY KEY,
    round_number INT UNIQUE NOT NULL,
    global_model_version VARCHAR(64),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    participating_clients INT NOT NULL DEFAULT 0,
    training_loss DOUBLE PRECISION,
    mae DOUBLE PRECISION,
    rmse DOUBLE PRECISION,
    r2 DOUBLE PRECISION,
    status VARCHAR(30) NOT NULL DEFAULT 'STARTED'
);

CREATE TABLE IF NOT EXISTS federated_client_updates (
    id BIGSERIAL PRIMARY KEY,
    round_id BIGINT NOT NULL,
    client_id VARCHAR(64) NOT NULL,
    sample_count INT NOT NULL DEFAULT 0,
    training_epochs INT NOT NULL DEFAULT 1,
    training_loss DOUBLE PRECISION,
    update_status VARCHAR(30) NOT NULL DEFAULT 'ACCEPTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fed_updates_round 
    ON federated_client_updates (round_id);

CREATE TABLE IF NOT EXISTS federated_model_versions (
    id BIGSERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) UNIQUE NOT NULL,
    round_number INT NOT NULL,
    algorithm VARCHAR(50) NOT NULL DEFAULT 'FED_LINEAR_REGRESSION',
    client_count INT NOT NULL DEFAULT 0,
    sample_count INT NOT NULL DEFAULT 0,
    artifact_path VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Phase 9: Operational Digital Twin Layer
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS digital_twins (
    id BIGSERIAL PRIMARY KEY,
    twin_code VARCHAR(64) UNIQUE NOT NULL,
    machine_id BIGINT UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synchronized_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_digital_twins_machine 
    ON digital_twins (machine_id);

CREATE TABLE IF NOT EXISTS digital_twin_states (
    id BIGSERIAL PRIMARY KEY,
    digital_twin_id BIGINT UNIQUE NOT NULL,
    machine_id BIGINT NOT NULL,
    operating_state VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    temperature DOUBLE PRECISION,
    vibration DOUBLE PRECISION,
    current DOUBLE PRECISION,
    pressure DOUBLE PRECISION,
    rpm DOUBLE PRECISION,
    acoustic DOUBLE PRECISION,
    health_score DOUBLE PRECISION,
    health_status VARCHAR(30),
    rul_hours DOUBLE PRECISION,
    rul_status VARCHAR(30),
    last_telemetry_timestamp TIMESTAMPTZ,
    last_prediction_timestamp TIMESTAMPTZ,
    active_alert_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_states_machine 
    ON digital_twin_states (machine_id);

CREATE TABLE IF NOT EXISTS digital_twin_state_history (
    id BIGSERIAL PRIMARY KEY,
    digital_twin_id BIGINT NOT NULL,
    machine_id BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operating_state VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    health_score DOUBLE PRECISION,
    health_status VARCHAR(30),
    rul_hours DOUBLE PRECISION,
    rul_status VARCHAR(30),
    temperature DOUBLE PRECISION,
    vibration DOUBLE PRECISION,
    current DOUBLE PRECISION,
    pressure DOUBLE PRECISION,
    rpm DOUBLE PRECISION,
    acoustic DOUBLE PRECISION,
    active_alert_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dt_history_twin_time 
    ON digital_twin_state_history (digital_twin_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_dt_history_machine_time 
    ON digital_twin_state_history (machine_id, timestamp DESC);

-- Log completion of initialization
DO $$
BEGIN
    RAISE NOTICE 'FedMaintain database initialization completed successfully for Phases 1-9.';
END $$;
