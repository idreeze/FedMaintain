package com.fedmaintain.ml.explainability;

import com.fedmaintain.feature.entity.MachineBaseline;
import com.fedmaintain.feature.entity.MachineFeature;
import com.fedmaintain.feature.repository.MachineFeatureRepository;
import com.fedmaintain.feature.service.MachineBaselineService;
import com.fedmaintain.machine.entity.Machine;
import com.fedmaintain.ml.entity.RulPrediction;
import com.fedmaintain.ml.entity.RulStatus;
import com.fedmaintain.ml.explainability.dto.ExplanationResponse;
import com.fedmaintain.ml.explainability.dto.FeatureFactorDto;
import com.fedmaintain.ml.explainability.entity.ContributionLevel;
import com.fedmaintain.ml.explainability.entity.DeviationDirection;
import com.fedmaintain.ml.explainability.repository.PredictionExplanationRepository;
import com.fedmaintain.ml.explainability.service.impl.ExplainabilityServiceImpl;
import com.fedmaintain.ml.repository.RulPredictionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExplainabilityServiceTest {

    @Mock
    private RulPredictionRepository predictionRepository;

    @Mock
    private MachineFeatureRepository featureRepository;

    @Mock
    private MachineBaselineService baselineService;

    @Mock
    private PredictionExplanationRepository explanationRepository;

    @InjectMocks
    private ExplainabilityServiceImpl explainabilityService;

    @Test
    @DisplayName("Should calculate baseline deviation percentage, map contribution levels, and rank factors descending")
    void testExplainabilityFactorsAndRanking() {
        Machine machine = Machine.builder().id(1L).machineCode("ETCH-001").build();
        RulPrediction prediction = RulPrediction.builder()
                .id(100L)
                .machine(machine)
                .rulHours(12.5)
                .status(RulStatus.WARNING)
                .build();

        // Baseline: vibration = 0.50, temperature = 60.0, current = 10.0
        MachineBaseline baseline = MachineBaseline.builder()
                .machine(machine)
                .baselineVibration(0.50)
                .baselineTemperature(60.0)
                .baselineCurrent(10.0)
                .baselinePressure(2.5)
                .baselineRpm(1800.0)
                .baselineAcoustic(45.0)
                .build();

        // Current feature:
        // vibration_rms = 1.0 (deviation = |1.0 - 0.5| / 0.5 = 100% -> CRITICAL, POSITIVE)
        // temperature_mean = 75.0 (deviation = |75 - 60| / 60 = 25% -> MEDIUM, POSITIVE)
        // current_mean = 14.5 (deviation = |14.5 - 10| / 10 = 45% -> HIGH, POSITIVE)
        MachineFeature feature = MachineFeature.builder()
                .machine(machine)
                .vibrationRms(1.0)
                .temperatureMean(75.0)
                .currentMean(14.5)
                .pressureMean(2.5)
                .rpmMean(1800.0)
                .acousticMean(45.0)
                .build();

        when(predictionRepository.findById(100L)).thenReturn(Optional.of(prediction));
        when(featureRepository.findFirstByMachineIdOrderByWindowEndDesc(1L)).thenReturn(Optional.of(feature));
        when(baselineService.getOrCreateBaseline(1L)).thenReturn(baseline);

        ExplanationResponse response = explainabilityService.generateExplanation(100L);

        assertNotNull(response);
        assertEquals("ETCH-001", response.getMachineId());
        assertEquals(12.5, response.getRulHours());
        assertFalse(response.getFactors().isEmpty());

        // Top factor should be vibration_rms because 100% deviation > 45% current > 25% temp
        FeatureFactorDto topFactor = response.getFactors().get(0);
        assertEquals("vibration_rms", topFactor.getFeature());
        assertEquals(100.0, topFactor.getDeviationPercentage(), 0.1);
        assertEquals(ContributionLevel.CRITICAL, topFactor.getLevel());
        assertEquals(DeviationDirection.POSITIVE, topFactor.getDirection());

        // Factors must be sorted descending by deviation percentage
        for (int i = 1; i < response.getFactors().size(); i++) {
            assertTrue(response.getFactors().get(i - 1).getDeviationPercentage() >=
                    response.getFactors().get(i).getDeviationPercentage(),
                    "Factors must be sorted descending by deviation percentage");
        }

        verify(explanationRepository, times(1)).saveAll(any());
    }
}
