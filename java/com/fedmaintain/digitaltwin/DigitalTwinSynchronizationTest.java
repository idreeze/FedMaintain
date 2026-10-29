package com.fedmaintain.digitaltwin;

import com.fedmaintain.alert.repository.MaintenanceAlertRepository;
import com.fedmaintain.digitaltwin.config.DigitalTwinProperties;
import com.fedmaintain.digitaltwin.dto.DigitalTwinStateResponse;
import com.fedmaintain.digitaltwin.entity.*;
import com.fedmaintain.digitaltwin.repository.DigitalTwinRepository;
import com.fedmaintain.digitaltwin.repository.DigitalTwinStateHistoryRepository;
import com.fedmaintain.digitaltwin.repository.DigitalTwinStateRepository;
import com.fedmaintain.digitaltwin.service.DigitalTwinStateTransitionEngine;
import com.fedmaintain.digitaltwin.service.impl.DigitalTwinSynchronizationServiceImpl;
import com.fedmaintain.feature.service.FeatureService;
import com.fedmaintain.machine.entity.Machine;
import com.fedmaintain.machine.entity.MachineStatus;
import com.fedmaintain.machine.repository.MachineRepository;
import com.fedmaintain.ml.dto.RulPredictionResponse;
import com.fedmaintain.ml.entity.RulStatus;
import com.fedmaintain.ml.health.dto.MachineHealthResponse;
import com.fedmaintain.ml.health.entity.HealthStatus;
import com.fedmaintain.ml.health.service.MachineHealthService;
import com.fedmaintain.ml.prediction.RulPredictionService;
import com.fedmaintain.sensor.entity.ReadingQuality;
import com.fedmaintain.sensor.entity.SensorHealthState;
import com.fedmaintain.sensor.entity.SensorType;
import com.fedmaintain.telemetry.dto.MachineLatestReadingsResponse;
import com.fedmaintain.telemetry.service.TelemetryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DigitalTwinSynchronizationTest {

    @Mock
    private DigitalTwinRepository digitalTwinRepository;
    @Mock
    private DigitalTwinStateRepository digitalTwinStateRepository;
    @Mock
    private DigitalTwinStateHistoryRepository historyRepository;
    @Mock
    private MachineRepository machineRepository;
    @Mock
    private TelemetryService telemetryService;
    @Mock
    private FeatureService featureService;
    @Mock
    private RulPredictionService rulPredictionService;
    @Mock
    private MachineHealthService machineHealthService;
    @Mock
    private MaintenanceAlertRepository alertRepository;
    @Mock
    private DigitalTwinStateTransitionEngine transitionEngine;

    private DigitalTwinProperties properties;
    private DigitalTwinSynchronizationServiceImpl syncService;

    @BeforeEach
    void setUp() {
        properties = new DigitalTwinProperties();
        syncService = new DigitalTwinSynchronizationServiceImpl(
                digitalTwinRepository,
                digitalTwinStateRepository,
                historyRepository,
                machineRepository,
                telemetryService,
                featureService,
                rulPredictionService,
                machineHealthService,
                alertRepository,
                transitionEngine,
                properties
        );
    }

    @Test
    @DisplayName("Should synchronize machine telemetry, RUL, health, and alerts into Digital Twin state")
    void shouldSynchronizeMachineState() {
        Long machineId = 1L;
        Machine machine = Machine.builder()
                .id(machineId)
                .machineCode("CMP-001")
                .name("CMP Polisher")
                .status(MachineStatus.ACTIVE)
                .build();

        DigitalTwin twin = DigitalTwin.builder()
                .id(10L)
                .twinCode("DT-CMP-001")
                .machine(machine)
                .status(DigitalTwinStatus.ACTIVE)
                .build();

        Instant now = Instant.now();
        MachineLatestReadingsResponse.LatestReadingItem tempItem = MachineLatestReadingsResponse.LatestReadingItem.builder()
                .sensorCode("TEMP-001")
                .sensorType(SensorType.TEMPERATURE)
                .value(62.5)
                .unit("°C")
                .timestamp(now.minus(5, ChronoUnit.SECONDS))
                .quality(ReadingQuality.GOOD)
                .status(SensorHealthState.NORMAL)
                .build();

        MachineLatestReadingsResponse latestReadings = MachineLatestReadingsResponse.builder()
                .machineId(machineId)
                .machineCode("CMP-001")
                .readings(List.of(tempItem))
                .build();

        RulPredictionResponse rulResponse = RulPredictionResponse.builder()
                .machineId(machineId)
                .rulHours(128.0)
                .status(RulStatus.NORMAL)
                .predictionTime(now.minus(2, ChronoUnit.MINUTES))
                .build();

        MachineHealthResponse healthResponse = MachineHealthResponse.builder()
                .machineId("1")
                .healthScore(88)
                .status(HealthStatus.HEALTHY)
                .rulHours(128.0)
                .calculatedAt(now.minus(1, ChronoUnit.MINUTES))
                .build();

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(digitalTwinRepository.findByMachineId(machineId)).thenReturn(Optional.of(twin));
        when(telemetryService.getLatestReadingsByMachine(machineId)).thenReturn(latestReadings);
        when(rulPredictionService.getLatestPrediction(machineId)).thenReturn(rulResponse);
        when(machineHealthService.calculateHealth(machineId)).thenReturn(healthResponse);
        when(alertRepository.findByMachineIdAndStatusIn(any(), any())).thenReturn(Collections.emptyList());

        when(transitionEngine.determineOperatingState(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(MachineOperatingState.NORMAL);

        when(digitalTwinStateRepository.findByDigitalTwinId(10L)).thenReturn(Optional.empty());
        when(digitalTwinStateRepository.save(any(DigitalTwinState.class))).thenAnswer(inv -> {
            DigitalTwinState s = inv.getArgument(0);
            s.setId(100L);
            return s;
        });

        DigitalTwinStateResponse stateResponse = syncService.synchronizeMachine(machineId);

        assertNotNull(stateResponse);
        assertEquals(MachineOperatingState.NORMAL, stateResponse.getOperatingState());
        assertEquals(62.5, stateResponse.getTemperature());
        assertEquals(88.0, stateResponse.getHealthScore());
        assertEquals(128.0, stateResponse.getRulHours());
        assertEquals(0, stateResponse.getActiveAlertCount());

        verify(digitalTwinRepository).save(twin);
        verify(digitalTwinStateRepository).save(any(DigitalTwinState.class));
    }
}
