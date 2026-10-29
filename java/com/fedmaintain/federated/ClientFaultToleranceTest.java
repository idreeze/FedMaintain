package com.fedmaintain.federated;

import com.fedmaintain.federated.aggregation.FedAvgAggregator;
import com.fedmaintain.federated.aggregation.ModelUpdateValidator;
import com.fedmaintain.federated.client.SimulatedFederatedClient;
import com.fedmaintain.federated.dataset.LocalPlantDatasetService;
import com.fedmaintain.federated.dto.FederatedRoundResponse;
import com.fedmaintain.federated.dto.StartFederatedRoundRequest;
import com.fedmaintain.federated.entity.FederatedClientEntity;
import com.fedmaintain.federated.entity.FederatedClientStatus;
import com.fedmaintain.federated.entity.FederatedRoundEntity;
import com.fedmaintain.federated.entity.FederatedRoundStatus;
import com.fedmaintain.federated.model.FederatedLinearRegressionModel;
import com.fedmaintain.federated.privacy.PrivacyProtectionStrategy;
import com.fedmaintain.federated.repository.FederatedClientRepository;
import com.fedmaintain.federated.repository.FederatedClientUpdateRepository;
import com.fedmaintain.federated.repository.FederatedModelVersionRepository;
import com.fedmaintain.federated.repository.FederatedRoundRepository;
import com.fedmaintain.federated.service.impl.FederatedTrainingServiceImpl;
import com.fedmaintain.ml.evaluation.ModelEvaluationService;
import com.fedmaintain.ml.service.ModelStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClientFaultToleranceTest {

    @Mock
    private FederatedClientRepository clientRepository;

    @Mock
    private FederatedRoundRepository roundRepository;

    @Mock
    private FederatedClientUpdateRepository updateRepository;

    @Mock
    private FederatedModelVersionRepository modelVersionRepository;

    @Mock
    private SimulatedFederatedClient clientExecutor;

    @Mock
    private FedAvgAggregator aggregator;

    @Mock
    private ModelUpdateValidator updateValidator;

    @Mock
    private PrivacyProtectionStrategy privacyStrategy;

    @Mock
    private ModelEvaluationService evaluationService;

    @Mock
    private LocalPlantDatasetService datasetService;

    @Mock
    private ModelStorageService storageService;

    @InjectMocks
    private FederatedTrainingServiceImpl federatedService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(federatedService, "minimumClients", 2);
    }

    @Test
    @DisplayName("Should fail round when active clients are fewer than minimumClients (e.g. only 1 active)")
    void testRoundFailsWhenUnderMinimumClients() {
        FederatedClientEntity clientA = FederatedClientEntity.builder()
                .clientId("PLANT-A")
                .status(FederatedClientStatus.ACTIVE)
                .build();
        FederatedClientEntity clientB = FederatedClientEntity.builder()
                .clientId("PLANT-B")
                .status(FederatedClientStatus.INACTIVE)
                .build();
        FederatedClientEntity clientC = FederatedClientEntity.builder()
                .clientId("PLANT-C")
                .status(FederatedClientStatus.INACTIVE)
                .build();

        when(clientRepository.count()).thenReturn(3L);
        when(clientRepository.findAll()).thenReturn(List.of(clientA, clientB, clientC));
        when(roundRepository.count()).thenReturn(0L);
        when(roundRepository.save(any(FederatedRoundEntity.class))).thenAnswer(i -> i.getArgument(0));

        StartFederatedRoundRequest request = StartFederatedRoundRequest.builder()
                .clientIds(List.of("PLANT-A", "PLANT-B", "PLANT-C"))
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> federatedService.startRound(request));
        assertTrue(ex.getMessage().contains("insufficient participating clients"), "Exception must explain client deficiency");
        verify(roundRepository).save(argThat(r -> r.getStatus() == FederatedRoundStatus.FAILED));
    }

    @Test
    @DisplayName("Should succeed round when 2 of 3 clients are active and 1 is INACTIVE (fault tolerance)")
    void testRoundSucceedsWithTwoActiveClients() {
        FederatedClientEntity clientA = FederatedClientEntity.builder()
                .clientId("PLANT-A")
                .status(FederatedClientStatus.ACTIVE)
                .build();
        FederatedClientEntity clientB = FederatedClientEntity.builder()
                .clientId("PLANT-B")
                .status(FederatedClientStatus.ACTIVE)
                .build();
        FederatedClientEntity clientC = FederatedClientEntity.builder()
                .clientId("PLANT-C")
                .status(FederatedClientStatus.INACTIVE) // 1 client dropped
                .build();

        when(clientRepository.count()).thenReturn(3L);
        when(clientRepository.findAll()).thenReturn(List.of(clientA, clientB, clientC));
        when(roundRepository.count()).thenReturn(0L);
        when(roundRepository.save(any(FederatedRoundEntity.class))).thenAnswer(i -> i.getArgument(0));
        when(modelVersionRepository.findFirstByOrderByRoundNumberDesc()).thenReturn(Optional.empty());

        FedAvgAggregator.ClientUpdate updateA = new FedAvgAggregator.ClientUpdate("PLANT-A", new double[6], 10.0, 50, 0.1);
        FedAvgAggregator.ClientUpdate updateB = new FedAvgAggregator.ClientUpdate("PLANT-B", new double[6], 12.0, 60, 0.12);

        when(clientExecutor.performLocalTraining(eq("PLANT-A"), any(), anyDouble(), anyInt(), anyDouble()))
                .thenReturn(updateA);
        when(clientExecutor.performLocalTraining(eq("PLANT-B"), any(), anyDouble(), anyInt(), anyDouble()))
                .thenReturn(updateB);

        when(privacyStrategy.prepareUpdate(any())).thenAnswer(i -> i.getArgument(0));
        when(privacyStrategy.validateUpdate(any())).thenReturn(true);
        when(updateValidator.validate(any(), anyInt(), any(), any())).thenReturn(true);

        FederatedLinearRegressionModel aggregatedModel = new FederatedLinearRegressionModel(6);
        when(aggregator.aggregate(any())).thenReturn(aggregatedModel);
        when(storageService.saveModel(anyString(), any())).thenReturn("model-artifacts/federated/test.bin");

        LocalPlantDatasetService.LocalDataset mockDataset = new LocalPlantDatasetService.LocalDataset(
                new double[][]{new double[6], new double[6], new double[6], new double[6]},
                new double[]{40.0, 38.0, 35.0, 30.0}
        );
        when(datasetService.getLocalDataset(anyString())).thenReturn(mockDataset);

        when(evaluationService.evaluate(any(), any()))
                .thenReturn(new ModelEvaluationService.EvaluationMetrics(1.2, 1.8, 0.85));

        StartFederatedRoundRequest request = StartFederatedRoundRequest.builder()
                .clientIds(List.of("PLANT-A", "PLANT-B", "PLANT-C"))
                .localEpochs(1)
                .learningRate(0.01)
                .build();

        FederatedRoundResponse response = federatedService.startRound(request);

        assertNotNull(response);
        assertEquals(FederatedRoundStatus.COMPLETED, response.getStatus());
        assertEquals(2, response.getParticipatingClients());
    }
}
