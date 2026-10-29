package com.fedmaintain.digitaltwin;

import com.fedmaintain.alert.entity.AlertSeverity;
import com.fedmaintain.alert.entity.AlertType;
import com.fedmaintain.alert.entity.MaintenanceAlert;
import com.fedmaintain.digitaltwin.config.DigitalTwinProperties;
import com.fedmaintain.digitaltwin.entity.MachineOperatingState;
import com.fedmaintain.digitaltwin.service.DigitalTwinStateTransitionEngine;
import com.fedmaintain.machine.entity.MachineStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DigitalTwinStateTransitionTest {

    private DigitalTwinStateTransitionEngine engine;
    private DigitalTwinProperties properties;

    @BeforeEach
    void setUp() {
        properties = new DigitalTwinProperties();
        properties.setOfflineTimeoutSeconds(60L);
        properties.getState().setCriticalRulHours(24.0);
        properties.getState().setWarningRulHours(72.0);
        properties.getState().setCriticalHealthScore(40.0);
        properties.getState().setWarningHealthScore(60.0);
        properties.getState().setDegradingHealthScore(80.0);
        properties.getState().setFailureHealthScore(20.0);

        engine = new DigitalTwinStateTransitionEngine(properties);
    }

    @Test
    @DisplayName("Should return MAINTENANCE when machine status is explicitly MAINTENANCE")
    void shouldReturnMaintenance() {
        Instant now = Instant.now();
        MachineOperatingState state = engine.determineOperatingState(
                MachineStatus.MAINTENANCE,
                now.minus(10, ChronoUnit.SECONDS),
                now,
                95.0,
                "HEALTHY",
                120.0,
                "NORMAL",
                Collections.emptyList()
        );
        assertEquals(MachineOperatingState.MAINTENANCE, state);
    }

    @Test
    @DisplayName("Should return OFFLINE when telemetry is stale beyond configured timeout")
    void shouldReturnOfflineOnStaleTelemetry() {
        Instant now = Instant.now();
        MachineOperatingState state = engine.determineOperatingState(
                MachineStatus.ACTIVE,
                now.minus(120, ChronoUnit.SECONDS), // 120s > 60s timeout
                now,
                95.0,
                "HEALTHY",
                120.0,
                "NORMAL",
                Collections.emptyList()
        );
        assertEquals(MachineOperatingState.OFFLINE, state);
    }

    @Test
    @DisplayName("Should return OFFLINE when telemetry timestamp is null")
    void shouldReturnOfflineOnNullTelemetry() {
        Instant now = Instant.now();
        MachineOperatingState state = engine.determineOperatingState(
                MachineStatus.ACTIVE,
                null,
                now,
                95.0,
                "HEALTHY",
                120.0,
                "NORMAL",
                Collections.emptyList()
        );
        assertEquals(MachineOperatingState.OFFLINE, state);
    }

    @Test
    @DisplayName("Should return FAILURE on health below failure threshold or failure alert")
    void shouldReturnFailure() {
        Instant now = Instant.now();
        MaintenanceAlert alert = MaintenanceAlert.builder()
                .severity(AlertSeverity.CRITICAL)
                .alertType(AlertType.MULTI_SENSOR_DEGRADATION)
                .title("CRITICAL FAILURE: Platen motor stalled")
                .build();

        MachineOperatingState state = engine.determineOperatingState(
                MachineStatus.ACTIVE,
                now.minus(5, ChronoUnit.SECONDS),
                now,
                15.0, // <= 20.0 failure health threshold
                "CRITICAL",
                5.0,
                "CRITICAL",
                List.of(alert)
        );
        assertEquals(MachineOperatingState.FAILURE, state);
    }

    @Test
    @DisplayName("Should return CRITICAL on critical alert or RUL <= 24h")
    void shouldReturnCritical() {
        Instant now = Instant.now();
        MaintenanceAlert alert = MaintenanceAlert.builder()
                .severity(AlertSeverity.CRITICAL)
                .alertType(AlertType.RUL_CRITICAL)
                .title("RUL Threshold Breach: 18h remaining")
                .build();

        MachineOperatingState state = engine.determineOperatingState(
                MachineStatus.ACTIVE,
                now.minus(5, ChronoUnit.SECONDS),
                now,
                38.0, // < 40.0
                "CRITICAL",
                18.0, // <= 24.0h
                "CRITICAL",
                List.of(alert)
        );
        assertEquals(MachineOperatingState.CRITICAL, state);
    }

    @Test
    @DisplayName("Should return WARNING on warning alert or RUL <= 72h")
    void shouldReturnWarning() {
        Instant now = Instant.now();
        MaintenanceAlert alert = MaintenanceAlert.builder()
                .severity(AlertSeverity.WARNING)
                .alertType(AlertType.VIBRATION_ANOMALY)
                .title("Vibration High")
                .build();

        MachineOperatingState state = engine.determineOperatingState(
                MachineStatus.ACTIVE,
                now.minus(5, ChronoUnit.SECONDS),
                now,
                55.0, // < 60.0
                "WARNING",
                48.0, // <= 72.0h
                "WARNING",
                List.of(alert)
        );
        assertEquals(MachineOperatingState.WARNING, state);
    }

    @Test
    @DisplayName("Should return DEGRADING on health < 80 or WATCH status")
    void shouldReturnDegrading() {
        Instant now = Instant.now();
        MachineOperatingState state = engine.determineOperatingState(
                MachineStatus.ACTIVE,
                now.minus(5, ChronoUnit.SECONDS),
                now,
                72.0, // < 80.0
                "WATCH",
                96.0,
                "NORMAL",
                Collections.emptyList()
        );
        assertEquals(MachineOperatingState.DEGRADING, state);
    }

    @Test
    @DisplayName("Should return NORMAL when all parameters are nominal and telemetry is fresh")
    void shouldReturnNormal() {
        Instant now = Instant.now();
        MachineOperatingState state = engine.determineOperatingState(
                MachineStatus.ACTIVE,
                now.minus(5, ChronoUnit.SECONDS),
                now,
                92.0,
                "HEALTHY",
                140.0,
                "NORMAL",
                Collections.emptyList()
        );
        assertEquals(MachineOperatingState.NORMAL, state);
    }
}
