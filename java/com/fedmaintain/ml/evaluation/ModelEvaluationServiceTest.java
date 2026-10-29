package com.fedmaintain.ml.evaluation;

import com.fedmaintain.ml.evaluation.ModelEvaluationService.EvaluationMetrics;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ModelEvaluationServiceTest {

    private final ModelEvaluationService evaluationService = new ModelEvaluationService();

    @Test
    @DisplayName("Should deterministically calculate MAE, RMSE, and R2")
    void testEvaluationMetricsCalculation() {
        List<Double> actuals = List.of(10.0, 20.0, 30.0, 40.0);
        List<Double> predictions = List.of(12.0, 19.0, 31.0, 38.0);

        EvaluationMetrics metrics = evaluationService.evaluate(actuals, predictions);

        // MAE: (2 + 1 + 1 + 2) / 4 = 1.5
        assertEquals(1.5, metrics.getMae(), 1e-4);

        // RMSE: sqrt(10 / 4) = sqrt(2.5) approx 1.5811
        assertEquals(Math.sqrt(2.5), metrics.getRmse(), 1e-3);

        // R2: 1 - (10 / 500) = 0.98
        assertEquals(0.98, metrics.getR2(), 1e-4);
    }

    @Test
    @DisplayName("Should handle empty and mismatched lists gracefully")
    void testEdgeCases() {
        EvaluationMetrics emptyMetrics = evaluationService.evaluate(List.of(), List.of());
        assertEquals(0.0, emptyMetrics.getMae());
        assertEquals(0.0, emptyMetrics.getRmse());
        assertEquals(0.0, emptyMetrics.getR2());

        EvaluationMetrics mismatched = evaluationService.evaluate(List.of(1.0), List.of(1.0, 2.0));
        assertEquals(0.0, mismatched.getMae());
    }
}
