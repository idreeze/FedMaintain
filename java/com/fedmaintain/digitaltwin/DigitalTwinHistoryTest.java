package com.fedmaintain.digitaltwin;

import com.fedmaintain.alert.repository.MaintenanceAlertRepository;
import com.fedmaintain.digitaltwin.config.DigitalTwinProperties;
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
import com.fedmaintain.ml.health.service.MachineHealthService;
import com.fedmaintain.ml.prediction.RulPredictionService;
import com.fedmaintain.telemetry.service.TelemetryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DigitalTwinHistoryTest {

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
        properties.setHistoryIntervalMinutes(5L);

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
    @DisplayName("Should immediately record snapshot on state transition")
    void shouldRecordSnapshotOnStateTransition() {
        Long machineId = 1L;
        Machine machine = Machine.builder()
                .id(machineId)
                .machineCode("CMP-001")
                .status(MachineStatus.ACTIVE)
                .build();

        DigitalTwin twin = DigitalTwin.builder()
                .id(10L)
                .twinCode("DT-CMP-001")
                .machine(machine)
                .build();

        DigitalTwinState existingState = DigitalTwinState.builder()
                .id(50L)
                .digitalTwin(twin)
                .machine(machine)
                .operatingState(MachineOperatingState.NORMAL)
                .build();

        DigitalTwinStateHistory previousSnapshot = DigitalTwinStateHistory.builder()
                .digitalTwin(twin)
                .machine(machine)
                .timestamp(Instant.now().minus(1, ChronoUnit.MINUTES)) // only 1 minute ago
                .operatingState(MachineOperatingState.NORMAL)
                .build();

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(digitalTwinRepository.findByMachineId(machineId)).thenReturn(Optional.of(twin));
        when(digitalTwinStateRepository.findByDigitalTwinId(10L)).thenReturn(Optional.of(existingState));
        when(digitalTwinStateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // State changes from NORMAL to WARNING
        when(transitionEngine.determineOperatingState(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(MachineOperatingState.WARNING);

        when(historyRepository.findFirstByDigitalTwinIdOrderByTimestampDesc(10L))
                .thenReturn(Optional.of(previousSnapshot));

        syncService.synchronizeMachine(machineId);

        // History snapshot should be saved because state changed from NORMAL to WARNING
        verify(historyRepository, times(1)).save(any(DigitalTwinStateHistory.class));
    }

    @Test
    @DisplayName("Should avoid duplicate snapshot when within interval and values have not materially changed")
    void shouldAvoidDuplicateSnapshotWithinInterval() {
        Long machineId = 1L;
        Machine machine = Machine.builder()
                .id(machineId)
                .machineCode("CMP-001")
                .status(MachineStatus.ACTIVE)
                .build();

        DigitalTwin twin = DigitalTwin.builder()
                .id(10L)
                .twinCode("DT-CMP-001")
                .machine(machine)
                .build();

        DigitalTwinState existingState = DigitalTwinState.builder()
                .id(50L)
                .digitalTwin(twin)
                .machine(machine)
                .operatingState(MachineOperatingState.NORMAL)
                .temperature(52.0)
                .vibration(1.5)
                .healthScore(90.0)
                .rulHours(120.0)
                .activeAlertCount(0)
                .build();

        DigitalTwinStateHistory previousSnapshot = DigitalTwinStateHistory.builder()
                .digitalTwin(twin)
                .machine(machine)
                .timestamp(Instant.now().minus(2, ChronoUnit.MINUTES)) // 2 min ago (< 5 min)
                .operatingState(MachineOperatingState.NORMAL)
                .temperature(52.1)
                .vibration(1.52)
                .healthScore(90.0)
                .rulHours(120.0)
                .activeAlertCount(0)
                .build();

        when(machineRepository.findById(machineId)).thenReturn(Optional.of(machine));
        when(digitalTwinRepository.findByMachineId(machineId)).thenReturn(Optional.of(twin));
        when(digitalTwinStateRepository.findByDigitalTwinId(10L)).thenReturn(Optional.of(existingState));
        when(digitalTwinStateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // State remains NORMAL
        when(transitionEngine.determineOperatingState(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(MachineOperatingState.NORMAL);

        when(historyRepository.findFirstByDigitalTwinIdOrderByTimestampDesc(10L))
                .thenReturn(Optional.of(previousSnapshot));

        syncService.synchronizeMachine(machineId);

        // Snapshot should NOT be saved
        verify(historyRepository, never()).save(any(DigitalTwinStateHistory.class));
    }
}
