package com.fedmaintain.federated.aggregation;

import com.fedmaintain.federated.aggregation.FedAvgAggregator.ClientUpdate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ModelUpdateValidatorTest {

    private final ModelUpdateValidator validator = new ModelUpdateValidator();
    private final Set<String> validClients = Set.of("PLANT-A", "PLANT-B", "PLANT-C");

    @Test
    @DisplayName("Should accept valid client update")
    void testValidUpdate() {
        ClientUpdate update = new ClientUpdate("PLANT-A", new double[]{0.1, -0.2, 0.5}, 1.0, 100, 0.05);
        boolean valid = validator.validate(update, 3, validClients, new HashSet<>());
        assertTrue(valid, "Clean update with matching dimension should be accepted");
    }

    @Test
    @DisplayName("Should reject null update, unknown client, and duplicate update")
    void testNullUnknownAndDuplicate() {
        assertFalse(validator.validate(null, 3, validClients, new HashSet<>()));

        ClientUpdate unknown = new ClientUpdate("UNKNOWN-PLANT", new double[]{0.1, 0.2, 0.3}, 1.0, 50, 0.1);
        assertFalse(validator.validate(unknown, 3, validClients, new HashSet<>()));

        Set<String> alreadySeen = Set.of("PLANT-A");
        ClientUpdate duplicate = new ClientUpdate("PLANT-A", new double[]{0.1, 0.2, 0.3}, 1.0, 50, 0.1);
        assertFalse(validator.validate(duplicate, 3, validClients, alreadySeen));
    }

    @Test
    @DisplayName("Should reject updates with NaN or Infinite parameters")
    void testNanAndInfinityRejection() {
        // Weight containing NaN
        ClientUpdate nanWeight = new ClientUpdate("PLANT-A", new double[]{0.1, Double.NaN, 0.3}, 1.0, 50, 0.1);
        assertFalse(validator.validate(nanWeight, 3, validClients, new HashSet<>()));

        // Weight containing Infinity
        ClientUpdate infWeight = new ClientUpdate("PLANT-A", new double[]{Double.POSITIVE_INFINITY, 0.2, 0.3}, 1.0, 50, 0.1);
        assertFalse(validator.validate(infWeight, 3, validClients, new HashSet<>()));

        // Bias containing NaN
        ClientUpdate nanBias = new ClientUpdate("PLANT-A", new double[]{0.1, 0.2, 0.3}, Double.NaN, 50, 0.1);
        assertFalse(validator.validate(nanBias, 3, validClients, new HashSet<>()));

        // Bias containing Infinity
        ClientUpdate infBias = new ClientUpdate("PLANT-A", new double[]{0.1, 0.2, 0.3}, Double.NEGATIVE_INFINITY, 50, 0.1);
        assertFalse(validator.validate(infBias, 3, validClients, new HashSet<>()));
    }

    @Test
    @DisplayName("Should reject dimension mismatch and non-positive sample count")
    void testDimensionMismatchAndZeroSamples() {
        // Expected 3, got 2
        ClientUpdate dimMismatch = new ClientUpdate("PLANT-A", new double[]{0.1, 0.2}, 1.0, 50, 0.1);
        assertFalse(validator.validate(dimMismatch, 3, validClients, new HashSet<>()));

        // Zero samples
        ClientUpdate zeroSamples = new ClientUpdate("PLANT-A", new double[]{0.1, 0.2, 0.3}, 1.0, 0, 0.1);
        assertFalse(validator.validate(zeroSamples, 3, validClients, new HashSet<>()));
    }
}
