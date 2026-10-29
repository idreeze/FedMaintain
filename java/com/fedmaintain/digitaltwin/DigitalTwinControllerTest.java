package com.fedmaintain.digitaltwin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fedmaintain.auth.dto.LoginRequest;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DigitalTwinControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String operatorToken;

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

        if (operatorToken == null) {
            LoginRequest opReq = LoginRequest.builder()
                    .email("operator@fedmaintain.com")
                    .password("Operator@123")
                    .build();

            MvcResult result = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(opReq)))
                    .andExpect(status().isOk())
                    .andReturn();

            operatorToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        }
    }

    @Test
    @DisplayName("GET /api/digital-twins - Operator can list digital twins")
    void testGetAllDigitalTwins() throws Exception {
        mockMvc.perform(get("/api/digital-twins")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].twinCode", startsWith("DT-")));
    }

    @Test
    @DisplayName("GET /api/digital-twins/machine/{machineId} - Operator can get digital twin by machine ID")
    void testGetDigitalTwinByMachineId() throws Exception {
        mockMvc.perform(get("/api/digital-twins/machine/1")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.machineId").value(1))
                .andExpect(jsonPath("$.data.twinCode", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/digital-twins/{machineId}/sync - Admin can trigger synchronization")
    void testSyncDigitalTwin() throws Exception {
        mockMvc.perform(post("/api/digital-twins/1/sync")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.operatingState", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/digital-twins/{machineId}/sync - Operator forbidden from syncing")
    void testOperatorForbiddenFromSync() throws Exception {
        mockMvc.perform(post("/api/digital-twins/1/sync")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/digital-twins/{id}/sensors - Operator can get sensor view")
    void testGetDigitalTwinSensors() throws Exception {
        mockMvc.perform(get("/api/digital-twins/1/sensors")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/digital-twins/{id}/timeline - Operator can get timeline events")
    void testGetDigitalTwinTimeline() throws Exception {
        mockMvc.perform(get("/api/digital-twins/1/timeline")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/digital-twins - Unauthenticated request rejected with 401")
    void testUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/digital-twins"))
                .andExpect(status().isUnauthorized());
    }
}
