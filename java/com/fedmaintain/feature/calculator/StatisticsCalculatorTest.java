package com.fedmaintain.feature.calculator;

import com.fedmaintain.feature.calculator.StatisticsCalculator.TimeValuePoint;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class StatisticsCalculatorTest {

    private final StatisticsCalculator calculator = new StatisticsCalculator();

    @Test
    @DisplayName("Should correctly calculate mean, min, max, and range")
    void testBasicSummaryStatistics() {
        List<Double> values = List.of(10.0, 20.0, 30.0, 40.0, 50.0);

        assertEquals(30.0, calculator.mean(values), 1e-6);
        assertEquals(10.0, calculator.min(values), 1e-6);
        assertEquals(50.0, calculator.max(values), 1e-6);
        assertEquals(40.0, calculator.range(values), 1e-6);
    }

    @Test
    @DisplayName("Should correctly calculate standard deviation and RMS")
    void testStdAndRms() {
        List<Double> values = List.of(2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0);
        double std = calculator.standardDeviation(values);
        assertEquals(2.138, std, 0.01);

        List<Double> rmsValues = List.of(3.0, 4.0);
        assertEquals(Math.sqrt(12.5), calculator.rootMeanSquare(rmsValues), 1e-4);
    }

    @Test
    @DisplayName("Should correctly calculate linear slope in units per minute")
    void testLinearSlope() {
        Instant t0 = Instant.parse("2026-09-20T10:00:00Z");
        List<TimeValuePoint> points = List.of(
                new TimeValuePoint(t0, 10.0),
                new TimeValuePoint(t0.plusSeconds(60), 12.0),
                new TimeValuePoint(t0.plusSeconds(120), 14.0),
                new TimeValuePoint(t0.plusSeconds(180), 16.0)
        );

        // Slope is +2.0 units per minute (60s)
        double slope = calculator.calculateSlope(points);
        assertEquals(2.0, slope, 1e-5);
    }

    @Test
    @DisplayName("Should handle empty and single element edge cases gracefully")
    void testEdgeCases() {
        assertNull(calculator.mean(List.of()));
        assertEquals(0.0, calculator.standardDeviation(List.of(5.0)));
        assertEquals(0.0, calculator.calculateSlope(List.of(new TimeValuePoint(Instant.now(), 42.0))));
    }
}
