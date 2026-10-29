package com.fedmaintain.feature.processor;

import com.fedmaintain.feature.processor.WindowGenerator.TimeWindow;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class WindowGeneratorTest {

    private final WindowGenerator generator = new WindowGenerator();

    @Test
    @DisplayName("Should generate correct 30-min windows with 5-min step")
    void testSlidingWindowGeneration() {
        Instant rangeStart = Instant.parse("2026-09-20T00:00:00Z");
        Instant rangeEnd = Instant.parse("2026-09-20T01:00:00Z"); // 60 minutes total
        Duration windowSize = Duration.ofMinutes(30);
        Duration stepSize = Duration.ofMinutes(5);

        List<TimeWindow> windows = generator.generateWindows(rangeStart, rangeEnd, windowSize, stepSize);

        // Windows:
        // [00:00, 00:30]
        // [00:05, 00:35]
        // [00:10, 00:40]
        // [00:15, 00:45]
        // [00:20, 00:50]
        // [00:25, 00:55]
        // [00:30, 01:00]
        // Total = 7 windows
        assertEquals(7, windows.size());

        TimeWindow first = windows.get(0);
        assertEquals(rangeStart, first.getStart());
        assertEquals(rangeStart.plus(windowSize), first.getEnd());

        TimeWindow last = windows.get(windows.size() - 1);
        assertEquals(rangeEnd, last.getEnd());
    }

    @Test
    @DisplayName("Should return single window if range is smaller than window size")
    void testRangeSmallerThanWindow() {
        Instant rangeStart = Instant.parse("2026-09-20T00:00:00Z");
        Instant rangeEnd = Instant.parse("2026-09-20T00:20:00Z");
        Duration windowSize = Duration.ofMinutes(30);
        Duration stepSize = Duration.ofMinutes(5);

        List<TimeWindow> windows = generator.generateWindows(rangeStart, rangeEnd, windowSize, stepSize);
        assertEquals(1, windows.size());
        assertEquals(rangeStart, windows.get(0).getStart());
        assertEquals(rangeEnd, windows.get(0).getEnd());
    }
}
