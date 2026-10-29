package com.fedmaintain.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fedmaintain.auth.dto.LoginRequest;
import com.fedmaintain.auth.dto.RegisterRequest;
import com.fedmaintain.user.entity.Role;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Order(1)
    void register_shouldSucceedForNewUser() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("John Engineer")
                .email("john@fedmaintain.com")
                .password("Password@123")
                .role(Role.ENGINEER)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User registered successfully"));
    }

    @Test
    @Order(2)
    void register_shouldFailWithDuplicateEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("John Engineer Duplicate")
                .email("john@fedmaintain.com")
                .password("Password@123")
                .role(Role.ENGINEER)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message", containsString("already registered")));
    }

    @Test
    @Order(3)
    void register_shouldFailWithInvalidPassword() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Short Pass")
                .email("shortpass@fedmaintain.com")
                .password("123") // too short
                .role(Role.OPERATOR)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @Order(4)
    void login_shouldSucceedAndReturnToken() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("john@fedmaintain.com")
                .password("Password@123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("john@fedmaintain.com"))
                .andExpect(jsonPath("$.user.name").value("John Engineer"))
                .andExpect(jsonPath("$.user.role").value("ENGINEER"));
    }

    @Test
    @Order(5)
    void login_shouldFailWithIncorrectPassword() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("john@fedmaintain.com")
                .password("WrongPassword@999")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @Order(6)
    void getMe_shouldReturnCurrentUserWhenAuthenticated() throws Exception {
        // First login to get a token
        LoginRequest loginRequest = LoginRequest.builder()
                .email("john@fedmaintain.com")
                .password("Password@123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseJson = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseJson).get("token").asText();

        // Call /api/auth/me with Bearer token
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("john@fedmaintain.com"))
                .andExpect(jsonPath("$.name").value("John Engineer"))
                .andExpect(jsonPath("$.role").value("ENGINEER"));
    }

    @Test
    @Order(7)
    void getMe_shouldFailWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
