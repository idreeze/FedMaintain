package com.fedmaintain.ml.health;

import com.fedmaintain.feature.entity.MachineBaseline;
import com.fedmaintain.feature.entity.MachineFeature;
import com.fedmaintain.feature.repository.MachineFeatureRepository;
import com.fedmaintain.feature.service.MachineBaselineService;
import com.fedmaintain.machine.entity.Machine;
import com.fedmaintain.machine.repository.MachineRepository;
import com.fedmaintain.ml.entity.RulPrediction;
import com.fedmaintain.ml.health.dto.MachineHealthResponse;
import com.fedmaintain.ml.health.entity.HealthStatus;
import com.fedmaintain.ml.health.service.impl.MachineHealthServiceImpl;
import com.fedmaintain.ml.repository.RulPredictionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MachineHealthServiceTest {

    @Mock
    private MachineRepository machineRepository;

    @Mock
    private MachineFeatureRepository featureRepository;

    @Mock
    private MachineBaselineService baselineService;

    @Mock
    private RulPredictionRepository predictionRepository;

    @InjectMocks
    private MachineHealthServiceImpl healthService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(healthService, "vibrationWeight", 0.30);
        ReflectionTestUtils.setField(healthService, "temperatureWeight", 0.20);
        ReflectionTestUtils.setField(healthService, "currentWeight", 0.15);
        ReflectionTestUtils.setField(healthService, "pressureWeight", 0.10);
        ReflectionTestUtils.setField(healthService, "rpmWeight", 0.10);
        ReflectionTestUtils.setField(healthService, "rulWeight", 0.15);
    }

    @Test
    @DisplayName("Should return 100 HEALTHY when all features are nominal and RUL > 72h")
    void testNominalHealthyMachine() {
        Machine machine = Machine.builder().id(1L).machineCode("CMP-001").build();
        MachineBaseline baseline = MachineBaseline.builder()
                .machine(machine)
                .baselineVibration(1.5)
                .baselineTemperature(50.0)
                .baselineCurrent(16.0)
                .baselinePressure(45.0)
                .baselineRpm(1800.0)
                .build();

        MachineFeature feature = MachineFeature.builder()
                .machine(machine)
                .vibrationRms(1.5)
                .temperatureMean(50.0)
                .currentMean(16.0)
                .pressureMean(45.0)
                .rpmMean(1800.0)
                .build();

        RulPrediction pred = RulPrediction.builder()
                .machine(machine)
                .rulHours(100.0)
                .build();

        when(machineRepository.findById(1L)).thenReturn(Optional.of(machine));
        when(baselineService.getOrCreateBaseline(1L)).thenReturn(baseline);
        when(featureRepository.findFirstByMachineIdOrderByWindowEndDesc(1L)).thenReturn(Optional.of(feature));
        when(predictionRepository.findFirstByMachineIdOrderByPredictionTimeDesc(1L)).thenReturn(Optional.of(pred));

        MachineHealthResponse res = healthService.calculateHealth(1L);

        assertEquals(100, res.getHealthScore());
        assertEquals(HealthStatus.HEALTHY, res.getStatus());
    }

    @Test
    @DisplayName("Should clamp health score to [0, 100] and map to CRITICAL when severely degraded")
    void testDegradedCriticalMachine() {
        Machine machine = Machine.builder().id(2L).machineCode("ETCH-002").build();
        MachineBaseline baseline = MachineBaseline.builder()
                .machine(machine)
                .baselineVibration(1.5)
                .baselineTemperature(50.0)
                .baselineCurrent(16.0)
                .baselinePressure(45.0)
                .baselineRpm(1800.0)
                .build();

        // Severely degraded values exceeding fail limits
        MachineFeature feature = MachineFeature.builder()
                .machine(machine)
                .vibrationRms(15.0)    // > 12.0 fail limit -> subScore 0
                .temperatureMean(105.0) // > 95.0 fail limit -> subScore 0
                .currentMean(55.0)     // > 46.0 fail limit -> subScore 0
                .pressureMean(95.0)    // > 85.0 fail limit -> subScore 0
                .rpmMean(1000.0)       // diff 800 > 700 limit -> subScore 0
                .build();

        RulPrediction pred = RulPrediction.builder()
                .machine(machine)
                .rulHours(2.0) // 2 / 72 * 100 = 2.77 -> rulScore ~ 2.77 -> totalScore ~ 0.41 -> rounded 0
                .build();

        when(machineRepository.findById(2L)).thenReturn(Optional.of(machine));
        when(baselineService.getOrCreateBaseline(2L)).thenReturn(baseline);
        when(featureRepository.findFirstByMachineIdOrderByWindowEndDesc(2L)).thenReturn(Optional.of(feature));
        when(predictionRepository.findFirstByMachineIdOrderByPredictionTimeDesc(2L)).thenReturn(Optional.of(pred));

        MachineHealthResponse res = healthService.calculateHealth(2L);

        assertTrue(res.getHealthScore() <= 5, "Health score must be clamped and close to 0");
        assertEquals(HealthStatus.CRITICAL, res.getStatus());
    }
}
