package com.fedmaintain.ml.dataset;

import com.fedmaintain.ml.dataset.LeakageFreeDatasetSplitter.DatasetSplit;
import com.fedmaintain.ml.entity.RulTrainingSample;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class LeakageFreeDatasetSplitterTest {

    private final LeakageFreeDatasetSplitter splitter = new LeakageFreeDatasetSplitter();

    @Test
    @DisplayName("Should split samples strictly by runId with ZERO overlapping run IDs between train and test")
    void testLeakageFreePartitioning() {
        List<RulTrainingSample> samples = new ArrayList<>();

        // Generate 5 runs, 10 samples each
        for (int run = 1; run <= 5; run++) {
            String runId = "RUN-00" + run;
            for (int s = 0; s < 10; s++) {
                samples.add(RulTrainingSample.builder()
                        .runId(runId)
                        .rulHours((double) (50 - s * 5))
                        .temperatureMean(60.0 + s)
                        .build());
            }
        }

        DatasetSplit split = splitter.splitByRun(samples, 0.70);

        assertFalse(split.getTrainingSet().isEmpty(), "Training set should not be empty");
        assertFalse(split.getTestSet().isEmpty(), "Test set should not be empty");

        Set<String> trainRuns = split.getTrainingRunIds();
        Set<String> testRuns = split.getTestRunIds();

        // Mathematical verification: disjoint sets
        assertTrue(Collections.disjoint(trainRuns, testRuns), "Training and test run IDs must be completely disjoint!");

        // Verify every sample in trainingSet has runId in trainRuns
        for (RulTrainingSample s : split.getTrainingSet()) {
            assertTrue(trainRuns.contains(s.getRunId()));
            assertFalse(testRuns.contains(s.getRunId()), "Data leakage detected: sample from test run found in train set!");
        }

        // Verify every sample in testSet has runId in testRuns
        for (RulTrainingSample s : split.getTestSet()) {
            assertTrue(testRuns.contains(s.getRunId()));
            assertFalse(trainRuns.contains(s.getRunId()), "Data leakage detected: sample from train run found in test set!");
        }
    }
}
