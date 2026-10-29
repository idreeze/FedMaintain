package com.fedmaintain.ml.dataset;

import com.fedmaintain.feature.entity.DataQualityState;
import com.fedmaintain.feature.entity.MachineFeature;
import com.fedmaintain.feature.repository.MachineFeatureRepository;
import com.fedmaintain.machine.entity.Machine;
import com.fedmaintain.ml.entity.MachineRun;
import com.fedmaintain.ml.entity.MlTrainingDataset;
import com.fedmaintain.ml.entity.RulTrainingSample;
import com.fedmaintain.ml.repository.MachineRunRepository;
import com.fedmaintain.ml.repository.MlTrainingDatasetRepository;
import com.fedmaintain.ml.repository.RulTrainingSampleRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RulLabelGenerationTest {

    @Mock
    private MachineRunRepository machineRunRepository;

    @Mock
    private MachineFeatureRepository machineFeatureRepository;

    @Mock
    private MlTrainingDatasetRepository datasetRepository;

    @Mock
    private RulTrainingSampleRepository sampleRepository;

    @InjectMocks
    private RulDatasetBuilder datasetBuilder;

    @Test
    @DisplayName("Should correctly calculate RUL hours = (failure - window_end) / 3600 and exclude post-failure & insufficient windows")
    void testRulLabelCalculationAndFiltering() {
        Machine machine = Machine.builder().id(10L).machineCode("CMP-001").build();
        Instant tStart = Instant.parse("2026-09-20T00:00:00Z");
        Instant tFail = Instant.parse("2026-09-20T10:00:00Z"); // 10 hours from start

        MachineRun run = MachineRun.builder()
                .id(1L)
                .runId("RUN-101")
                .machine(machine)
                .startTime(tStart)
                .failureTimestamp(tFail)
                .build();

        // Valid window 1: ends at 06:00:00 (4 hours before failure)
        MachineFeature mfValid = MachineFeature.builder()
                .machine(machine)
                .windowStart(Instant.parse("2026-09-20T05:30:00Z"))
                .windowEnd(Instant.parse("2026-09-20T06:00:00Z"))
                .dataQuality(DataQualityState.GOOD)
                .temperatureMean(65.0)
                .build();

        // Invalid window 2: ends after failure at 10:30:00
        MachineFeature mfPostFailure = MachineFeature.builder()
                .machine(machine)
                .windowStart(Instant.parse("2026-09-20T10:00:00Z"))
                .windowEnd(Instant.parse("2026-09-20T10:30:00Z"))
                .dataQuality(DataQualityState.GOOD)
                .build();

        // Invalid window 3: data quality is INSUFFICIENT
        MachineFeature mfInsufficient = MachineFeature.builder()
                .machine(machine)
                .windowStart(Instant.parse("2026-09-20T07:30:00Z"))
                .windowEnd(Instant.parse("2026-09-20T08:00:00Z"))
                .dataQuality(DataQualityState.INSUFFICIENT)
                .build();

        when(datasetRepository.findByDatasetVersion("v1.0")).thenReturn(Optional.of(
                MlTrainingDataset.builder().id(1L).datasetVersion("v1.0").build()
        ));
        when(datasetRepository.save(any(MlTrainingDataset.class))).thenAnswer(i -> i.getArgument(0));
        when(machineRunRepository.findByFailureTimestampIsNotNull()).thenReturn(List.of(run));
        when(machineFeatureRepository.findFeaturesInWindow(10L, tStart, tFail))
                .thenReturn(List.of(mfValid, mfPostFailure, mfInsufficient));

        MlTrainingDataset result = datasetBuilder.buildDataset("v1.0");
        assertNotNull(result);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<RulTrainingSample>> captor = ArgumentCaptor.forClass(List.class);
        verify(sampleRepository, times(1)).saveAll(captor.capture());

        List<RulTrainingSample> saved = captor.getValue();
        // Only the 1 valid sample should be saved
        assertEquals(1, saved.size());
        RulTrainingSample sample = saved.get(0);
        assertEquals("RUN-101", sample.getRunId());
        // Exactly 4.0 hours remaining (from 06:00:00 to 10:00:00 is 14400s / 3600 = 4.0)
        assertEquals(4.0, sample.getRulHours(), 1e-3);
    }
}
