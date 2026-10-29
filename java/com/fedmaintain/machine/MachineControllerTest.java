package com.fedmaintain.machine;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fedmaintain.auth.dto.LoginRequest;
import com.fedmaintain.machine.dto.CreateMachineRequest;
import com.fedmaintain.machine.dto.MachineStatusUpdateRequest;
import com.fedmaintain.machine.entity.MachineCriticality;
import com.fedmaintain.machine.entity.MachineStatus;
import org.junit.jupiter.api.BeforeEach;
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
class MachineControllerTest {

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
    void getMachines_shouldReturnPagedListWithFilters() throws Exception {
        mockMvc.perform(get("/api/machines")
                        .header("Authorization", "Bearer " + operatorToken)
                        .param("search", "CMP")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()))
                .andExpect(jsonPath("$.content[*].machineCode", hasItem("CMP-001")))
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(1)));
    }

    @Test
    void getMachineById_shouldReturnDetails() throws Exception {
        // First get list to get CMP-001 ID
        MvcResult listResult = mockMvc.perform(get("/api/machines")
                        .header("Authorization", "Bearer " + operatorToken)
                        .param("search", "CMP-001"))
                .andExpect(status().isOk())
                .andReturn();

        long machineId = objectMapper.readTree(listResult.getResponse().getContentAsString())
                .get("content").get(0).get("id").asLong();

        mockMvc.perform(get("/api/machines/" + machineId)
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineCode").value("CMP-001"))
                .andExpect(jsonPath("$.criticality").value("CRITICAL"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void updateMachineStatus_shouldUpdateState() throws Exception {
        MvcResult listResult = mockMvc.perform(get("/api/machines")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", "ETCH-001"))
                .andExpect(status().isOk())
                .andReturn();

        long machineId = objectMapper.readTree(listResult.getResponse().getContentAsString())
                .get("content").get(0).get("id").asLong();

        MachineStatusUpdateRequest statusReq = MachineStatusUpdateRequest.builder()
                .status(MachineStatus.MAINTENANCE)
                .build();

        mockMvc.perform(patch("/api/machines/" + machineId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));
    }

    @Test
    void createMachine_shouldSucceedForAdmin() throws Exception {
        // Get area ID for CMP area
        MvcResult plantsResult = mockMvc.perform(get("/api/plants")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        long plantId = objectMapper.readTree(plantsResult.getResponse().getContentAsString()).get(0).get("id").asLong();

        MvcResult areasResult = mockMvc.perform(get("/api/plants/" + plantId + "/areas")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        long areaId = objectMapper.readTree(areasResult.getResponse().getContentAsString()).get(0).get("id").asLong();

        CreateMachineRequest request = CreateMachineRequest.builder()
                .machineCode("CMP-002")
                .name("Applied Materials Reflexion LK Secondary")
                .machineType("CMP")
                .modelNumber("Reflexion LK CMP")
                .serialNumber("AMAT-2024-CMP-902")
                .manufacturer("Applied Materials")
                .criticality(MachineCriticality.HIGH)
                .build();

        mockMvc.perform(post("/api/areas/" + areaId + "/machines")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.machineCode").value("CMP-002"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
}
