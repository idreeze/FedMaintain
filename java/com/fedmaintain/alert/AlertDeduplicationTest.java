package com.fedmaintain.alert;

import com.fedmaintain.alert.entity.AlertSeverity;
import com.fedmaintain.alert.entity.AlertStatus;
import com.fedmaintain.alert.entity.AlertType;
import com.fedmaintain.alert.entity.MaintenanceAlert;
import com.fedmaintain.alert.repository.MaintenanceAlertRepository;
import com.fedmaintain.alert.service.impl.PredictiveAlertServiceImpl;
import com.fedmaintain.feature.entity.MachineBaseline;
import com.fedmaintain.feature.entity.MachineFeature;
import com.fedmaintain.feature.repository.MachineFeatureRepository;
import com.fedmaintain.feature.service.MachineBaselineService;
import com.fedmaintain.machine.entity.Machine;
import com.fedmaintain.machine.repository.MachineRepository;
import com.fedmaintain.ml.repository.RulPredictionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertDeduplicationTest {

    @Mock
    private MaintenanceAlertRepository alertRepository;

    @Mock
    private MachineRepository machineRepository;

    @Mock
    private MachineFeatureRepository featureRepository;

    @Mock
    private MachineBaselineService baselineService;

    @Mock
    private RulPredictionRepository predictionRepository;

    @InjectMocks
    private PredictiveAlertServiceImpl alertService;

    @Test
    @DisplayName("Should update existing OPEN alert instead of inserting a duplicate record for the same machine and alert type")
    void testAlertDeduplicationUpdatesExisting() {
        Machine machine = Machine.builder().id(1L).machineCode("CMP-001").build();

        MachineBaseline baseline = MachineBaseline.builder()
                .machine(machine)
                .baselineVibration(1.5)
                .baselineTemperature(50.0)
                .baselineCurrent(16.0)
                .baselinePressure(45.0)
                .baselineRpm(1800.0)
                .build();

        // An anomaly in vibration: 8.0 mm/s (critical vibration anomaly)
        MachineFeature feature = MachineFeature.builder()
                .machine(machine)
                .vibrationRms(8.0)
                .vibrationDeviationPct(200.0)
                .temperatureMean(50.0)
                .currentMean(16.0)
                .pressureMean(45.0)
                .rpmMean(1800.0)
                .build();

        // Already an existing OPEN alert for vibration anomaly
        MaintenanceAlert existingAlert = MaintenanceAlert.builder()
                .id(42L)
                .machine(machine)
                .alertType(AlertType.VIBRATION_ANOMALY)
                .severity(AlertSeverity.WARNING)
                .title("Initial Warning")
                .description("Initial description")
                .triggerValue(4.0)
                .status(AlertStatus.OPEN)
                .createdAt(Instant.now().minusSeconds(3600))
                .build();

        when(machineRepository.findById(1L)).thenReturn(Optional.of(machine));
        when(baselineService.getOrCreateBaseline(1L)).thenReturn(baseline);
        when(featureRepository.findFirstByMachineIdOrderByWindowEndDesc(1L)).thenReturn(Optional.of(feature));
        when(predictionRepository.findFirstByMachineIdOrderByPredictionTimeDesc(1L)).thenReturn(Optional.empty());

        // Return existing alert for VIBRATION_ANOMALY
        when(alertRepository.findFirstByMachineIdAndAlertTypeAndStatusIn(eq(1L), eq(AlertType.VIBRATION_ANOMALY), anyList()))
                .thenReturn(Optional.of(existingAlert));

        alertService.evaluateAlertsForMachine(1L);

        // Verify save was called on the existing alert with updated values (id 42 preserved)
        ArgumentCaptor<MaintenanceAlert> captor = ArgumentCaptor.forClass(MaintenanceAlert.class);
        verify(alertRepository, atLeastOnce()).save(captor.capture());

        MaintenanceAlert savedAlert = captor.getValue();
        assertEquals(42L, savedAlert.getId(), "Must update the existing alert ID instead of creating a new one");
        assertEquals(8.0, savedAlert.getTriggerValue());
        assertEquals(AlertSeverity.CRITICAL, savedAlert.getSeverity(), "Severity should escalate to CRITICAL");
    }
}
