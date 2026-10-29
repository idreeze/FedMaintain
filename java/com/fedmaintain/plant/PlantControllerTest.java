package com.fedmaintain.plant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fedmaintain.auth.dto.LoginRequest;
import com.fedmaintain.plant.dto.CreatePlantRequest;
import com.fedmaintain.plant.dto.UpdatePlantRequest;
import com.fedmaintain.plant.entity.PlantStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PlantControllerTest {

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
    void getAllPlants_shouldSucceedForAuthenticatedUsers() throws Exception {
        mockMvc.perform(get("/api/plants")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$[0].code").value("BLR-01"));
    }

    @Test
    void getAllPlants_shouldFailWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/plants"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createPlant_shouldSucceedForAdmin() throws Exception {
        CreatePlantRequest request = CreatePlantRequest.builder()
                .code("SGP-01")
                .name("Singapore Advanced Foundry 1")
                .location("Woodlands, Singapore")
                .description("Semiconductor 300mm Cleanroom")
                .build();

        mockMvc.perform(post("/api/plants")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.code").value("SGP-01"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createPlant_shouldFailForOperatorForbidden() throws Exception {
        CreatePlantRequest request = CreatePlantRequest.builder()
                .code("MY-01")
                .name("Penang Test Facility")
                .location("Penang, Malaysia")
                .build();

        mockMvc.perform(post("/api/plants")
                        .header("Authorization", "Bearer " + operatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updatePlant_shouldSucceedForAdmin() throws Exception {
        // Retrieve BLR-01
        MvcResult listResult = mockMvc.perform(get("/api/plants")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        long plantId = objectMapper.readTree(listResult.getResponse().getContentAsString()).get(0).get("id").asLong();

        UpdatePlantRequest updateReq = UpdatePlantRequest.builder()
                .name("Bengaluru Fab 1 - Expanded")
                .location("Whitefield Semiconductor Park, Bengaluru, India")
                .description("Semiconductor 300mm Advanced Fab")
                .status(PlantStatus.ACTIVE)
                .build();

        mockMvc.perform(put("/api/plants/" + plantId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Bengaluru Fab 1 - Expanded"))
                .andExpect(jsonPath("$.description").value("Semiconductor 300mm Advanced Fab"));
    }
}
