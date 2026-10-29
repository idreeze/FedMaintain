package com.fedmaintain.federated;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fedmaintain.auth.dto.LoginRequest;
import com.fedmaintain.federated.dto.StartFederatedRoundRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FederatedRoundIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        if (adminToken == null) {
            LoginRequest adminReq = LoginRequest.builder()
                    .email("admin@fedmaintain.com")
                    .password("Admin@123")
                    .build();

            MvcResult result = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(adminReq)))
                    .andExpect(status().isOk())
                    .andReturn();

            adminToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        }
    }

    @Test
    @DisplayName("Integration: Bootstrap clients, execute federated round, verify global model and comparison")
    void testFederatedRoundFlow() throws Exception {
        // 1. Verify clients are bootstrapped and queryable
        mockMvc.perform(get("/api/federated/clients")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(3))));

        // 2. Start a federated training round across simulated plants
        StartFederatedRoundRequest request = StartFederatedRoundRequest.builder()
                .clientIds(List.of("PLANT-A", "PLANT-B", "PLANT-C"))
                .localEpochs(3)
                .learningRate(0.01)
                .build();

        mockMvc.perform(post("/api/federated/rounds/start")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.participatingClients").value(3))
                .andExpect(jsonPath("$.data.globalModelVersion", containsString("FED-RUL-v")));

        // 3. Query all rounds
        mockMvc.perform(get("/api/federated/rounds")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // 4. Query global federated models
        mockMvc.perform(get("/api/federated/models")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // 5. Query metrics
        mockMvc.perform(get("/api/federated/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRoundsCompleted", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.totalClients", greaterThanOrEqualTo(3)));

        // 6. Query centralized vs federated comparison
        mockMvc.perform(get("/api/federated/comparison")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.federatedModelVersion").value("FED-RUL-v1"))
                .andExpect(jsonPath("$.data.privacyStrategy").isNotEmpty());
    }
}
