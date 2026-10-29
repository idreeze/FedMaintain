package com.fedmaintain.federated.aggregation;

import com.fedmaintain.federated.aggregation.FedAvgAggregator.ClientUpdate;
import com.fedmaintain.federated.model.FederatedLinearRegressionModel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FedAvgAggregatorTest {

    private final FedAvgAggregator aggregator = new FedAvgAggregator();

    @Test
    @DisplayName("MUST test exact FedAvg mathematical formula: Client A (w=2, n=100) + Client B (w=4, n=300) -> w_global = 3.5")
    void testExactWeightedFedAvgFormula() {
        // Client A: weights = [2.0], bias = 1.0, n = 100
        ClientUpdate updateA = new ClientUpdate("CLIENT-A", new double[]{2.0}, 1.0, 100, 0.12);

        // Client B: weights = [4.0], bias = 5.0, n = 300
        ClientUpdate updateB = new ClientUpdate("CLIENT-B", new double[]{4.0}, 5.0, 300, 0.08);

        FederatedLinearRegressionModel globalModel = aggregator.aggregate(List.of(updateA, updateB));

        assertNotNull(globalModel);
        assertEquals(1, globalModel.getFeatureCount());

        // Expected w_global = (2.0 * 100 + 4.0 * 300) / (100 + 300) = (200 + 1200) / 400 = 1400 / 400 = 3.5
        assertEquals(3.5, globalModel.getWeights()[0], 1e-6, "Global weight must equal exactly 3.5");

        // Expected b_global = (1.0 * 100 + 5.0 * 300) / (100 + 300) = (100 + 1500) / 400 = 1600 / 400 = 4.0
        assertEquals(4.0, globalModel.getBias(), 1e-6, "Global bias must equal exactly 4.0");
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when updates list is empty or total samples is zero")
    void testEmptyAndZeroSampleUpdates() {
        assertThrows(IllegalArgumentException.class, () -> aggregator.aggregate(List.of()));

        ClientUpdate zeroSample = new ClientUpdate("CLIENT-Z", new double[]{1.0}, 0.0, 0, 0.0);
        assertThrows(IllegalArgumentException.class, () -> aggregator.aggregate(List.of(zeroSample)));
    }
}
