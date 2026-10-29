package com.fedmaintain.digitaltwin;

import com.fedmaintain.alert.entity.AlertSeverity;
import com.fedmaintain.alert.entity.AlertType;
import com.fedmaintain.alert.entity.MaintenanceAlert;
import com.fedmaintain.alert.repository.MaintenanceAlertRepository;
import com.fedmaintain.digitaltwin.dto.DigitalTwinTimelineEventDto;
import com.fedmaintain.digitaltwin.entity.*;
import com.fedmaintain.digitaltwin.repository.DigitalTwinRepository;
import com.fedmaintain.digitaltwin.repository.DigitalTwinStateHistoryRepository;
import com.fedmaintain.digitaltwin.repository.DigitalTwinStateRepository;
import com.fedmaintain.digitaltwin.service.DigitalTwinSynchronizationService;
import com.fedmaintain.digitaltwin.service.impl.DigitalTwinServiceImpl;
import com.fedmaintain.machine.entity.Machine;
import com.fedmaintain.machine.repository.MachineRepository;
import com.fedmaintain.ml.entity.RulPrediction;
import com.fedmaintain.ml.repository.RulPredictionRepository;
import com.fedmaintain.sensor.repository.SensorReadingRepository;
import com.fedmaintain.sensor.repository.SensorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DigitalTwinTimelineTest {

    @Mock
    private DigitalTwinRepository digitalTwinRepository;
    @Mock
    private DigitalTwinStateRepository stateRepository;
    @Mock
    private DigitalTwinStateHistoryRepository historyRepository;
    @Mock
    private MachineRepository machineRepository;
    @Mock
    private SensorRepository sensorRepository;
    @Mock
    private SensorReadingRepository readingRepository;
    @Mock
    private MaintenanceAlertRepository alertRepository;
    @Mock
    private RulPredictionRepository predictionRepository;
    @Mock
    private DigitalTwinSynchronizationService syncService;

    private DigitalTwinServiceImpl digitalTwinService;

    @BeforeEach
    void setUp() {
        digitalTwinService = new DigitalTwinServiceImpl(
                digitalTwinRepository,
                stateRepository,
                historyRepository,
                machineRepository,
                sensorRepository,
                readingRepository,
                alertRepository,
                predictionRepository,
                syncService
        );
    }

    @Test
    @DisplayName("Should aggregate timeline events and order them chronologically descending")
    void shouldAggregateAndOrderTimelineEvents() {
        Long twinId = 1L;
        Long machineId = 10L;

        Machine machine = Machine.builder()
                .id(machineId)
                .machineCode("CMP-001")
                .build();

        Instant t0 = Instant.now().minus(60, ChronoUnit.MINUTES);
        Instant t1 = Instant.now().minus(40, ChronoUnit.MINUTES);
        Instant t2 = Instant.now().minus(20, ChronoUnit.MINUTES);
        Instant t3 = Instant.now().minus(5, ChronoUnit.MINUTES);

        DigitalTwin twin = DigitalTwin.builder()
                .id(twinId)
                .twinCode("DT-CMP-001")
                .machine(machine)
                .createdAt(t0)
                .build();

        DigitalTwinStateHistory h1 = DigitalTwinStateHistory.builder()
                .digitalTwin(twin)
                .machine(machine)
                .operatingState(MachineOperatingState.NORMAL)
                .timestamp(t0)
                .build();

        DigitalTwinStateHistory h2 = DigitalTwinStateHistory.builder()
                .digitalTwin(twin)
                .machine(machine)
                .operatingState(MachineOperatingState.WARNING)
                .timestamp(t1)
                .build();

        MaintenanceAlert alert = MaintenanceAlert.builder()
                .id(100L)
                .machine(machine)
                .title("Elevated Vibration Warning")
                .alertType(AlertType.VIBRATION_ANOMALY)
                .severity(AlertSeverity.WARNING)
                .createdAt(t2)
                .build();

        RulPrediction pred = RulPrediction.builder()
                .id(200L)
                .machine(machine)
                .rulHours(45.0)
                .predictionTime(t3)
                .build();

        when(digitalTwinRepository.findById(twinId)).thenReturn(Optional.of(twin));
        when(historyRepository.findTop30ByDigitalTwinIdOrderByTimestampDesc(twinId)).thenReturn(List.of(h2, h1));
        when(alertRepository.findByMachineIdOrderByCreatedAtDesc(eq(machineId), any()))
                .thenReturn(new PageImpl<>(List.of(alert)));
        when(predictionRepository.findTop30ByMachineIdOrderByPredictionTimeDesc(machineId))
                .thenReturn(List.of(pred));

        List<DigitalTwinTimelineEventDto> timeline = digitalTwinService.getDigitalTwinTimeline(twinId);

        assertNotNull(timeline);
        assertFalse(timeline.isEmpty());

        // Verify chronological descending order: t3 > t2 > t1 > t0
        for (int i = 0; i < timeline.size() - 1; i++) {
            Instant current = timeline.get(i).getTimestamp();
            Instant next = timeline.get(i + 1).getTimestamp();
            if (current != null && next != null) {
                assertTrue(current.isAfter(next) || current.equals(next),
                        "Events must be sorted in descending order: " + current + " >= " + next);
            }
        }
    }
}
