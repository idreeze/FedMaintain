package com.fedmaintain.telemetry;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fedmaintain.auth.dto.LoginRequest;
import com.fedmaintain.sensor.dto.CreateSensorRequest;
import com.fedmaintain.sensor.entity.SensorType;
import com.fedmaintain.telemetry.dto.SensorReadingMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SensorAndTelemetryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String operatorToken;
    private long cmpMachineId;
    private long cmpTempSensorId;

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

        // Get machine ID
        MvcResult machinesResult = mockMvc.perform(get("/api/machines")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", "CMP-001"))
                .andExpect(status().isOk())
                .andReturn();

        cmpMachineId = objectMapper.readTree(machinesResult.getResponse().getContentAsString())
                .get("content").get(0).get("id").asLong();

        // Get sensors for CMP-001
        MvcResult sensorsResult = mockMvc.perform(get("/api/machines/" + cmpMachineId + "/sensors")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        cmpTempSensorId = objectMapper.readTree(sensorsResult.getResponse().getContentAsString())
                .get(0).get("id").asLong();
    }

    @Test
    void getSensorsByMachine_shouldReturnSensorsList() throws Exception {
        mockMvc.perform(get("/api/machines/" + cmpMachineId + "/sensors")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(6)))
                .andExpect(jsonPath("$[0].machineCode").value("CMP-001"));
    }

    @Test
    void ingestTelemetry_andGetLatest_shouldSucceed() throws Exception {
        SensorReadingMessage message = SensorReadingMessage.builder()
                .machineCode("CMP-001")
                .sensorCode("CMP-001-TEMP-01")
                .sensorType(SensorType.TEMPERATURE)
                .value(54.2)
                .unit("°C")
                .timestamp(Instant.now())
                .build();

        // Ingest reading
        mockMvc.perform(post("/api/telemetry/readings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(message)))
                .andExpect(status().isAccepted());

        // Check latest reading for sensor
        mockMvc.perform(get("/api/sensors/" + cmpTempSensorId + "/latest")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value(54.2))
                .andExpect(jsonPath("$.quality").value("GOOD"));
    }

    @Test
    void getMachineLatestReadings_shouldReturnAllMachineSensors() throws Exception {
        mockMvc.perform(get("/api/machines/" + cmpMachineId + "/latest-readings")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineCode").value("CMP-001"))
                .andExpect(jsonPath("$.readings.length()", greaterThanOrEqualTo(6)));
    }

    @Test
    void getTelemetrySummary_shouldReturnAggregatedMetrics() throws Exception {
        mockMvc.perform(get("/api/machines/" + cmpMachineId + "/telemetry/summary")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineCode").value("CMP-001"))
                .andExpect(jsonPath("$.sensors", notNullValue()));
    }

    @Test
    void simulatorTick_shouldGenerateReadings() throws Exception {
        mockMvc.perform(post("/api/simulator/tick")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.simulatedCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.mode").value("NORMAL"));
    }

    @Test
    void getDashboardStats_shouldReturnAssetAndSensorMetrics() throws Exception {
        mockMvc.perform(get("/api/dashboard/stats")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPlants", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalAreas", greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$.totalMachines", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.totalSensors", greaterThanOrEqualTo(10)));
    }
}
