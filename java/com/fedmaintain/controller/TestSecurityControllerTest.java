package com.fedmaintain.controller;

import com.fedmaintain.security.JwtService;
import com.fedmaintain.user.entity.Role;
import com.fedmaintain.user.entity.User;
import com.fedmaintain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TestSecurityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String engineerToken;
    private String operatorToken;

    @BeforeEach
    void setUp() {
        // Setup users and tokens if not present
        if (!userRepository.existsByEmail("admin_test@fedmaintain.com")) {
            User admin = User.builder()
                    .name("Admin User")
                    .email("admin_test@fedmaintain.com")
                    .password(passwordEncoder.encode("Pass@123"))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
        }

        if (!userRepository.existsByEmail("engineer_test@fedmaintain.com")) {
            User engineer = User.builder()
                    .name("Engineer User")
                    .email("engineer_test@fedmaintain.com")
                    .password(passwordEncoder.encode("Pass@123"))
                    .role(Role.ENGINEER)
                    .enabled(true)
                    .build();
            userRepository.save(engineer);
        }

        if (!userRepository.existsByEmail("operator_test@fedmaintain.com")) {
            User operator = User.builder()
                    .name("Operator User")
                    .email("operator_test@fedmaintain.com")
                    .password(passwordEncoder.encode("Pass@123"))
                    .role(Role.OPERATOR)
                    .enabled(true)
                    .build();
            userRepository.save(operator);
        }

        adminToken = jwtService.generateToken(Map.of("role", "ADMIN"), "admin_test@fedmaintain.com");
        engineerToken = jwtService.generateToken(Map.of("role", "ENGINEER"), "engineer_test@fedmaintain.com");
        operatorToken = jwtService.generateToken(Map.of("role", "OPERATOR"), "operator_test@fedmaintain.com");
    }

    @Test
    void unauthenticatedRequests_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/test/admin")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/test/engineer")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/test/operator")).andExpect(status().isUnauthorized());
    }

    @Test
    void adminUser_shouldAccessAllTestEndpoints() throws Exception {
        mockMvc.perform(get("/api/test/admin").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        mockMvc.perform(get("/api/test/engineer").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ENGINEER"));

        mockMvc.perform(get("/api/test/operator").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("OPERATOR"));
    }

    @Test
    void engineerUser_shouldAccessEngineerAndOperatorEndpoints_butDeniedAdmin() throws Exception {
        mockMvc.perform(get("/api/test/admin").header("Authorization", "Bearer " + engineerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/test/engineer").header("Authorization", "Bearer " + engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ENGINEER"));

        mockMvc.perform(get("/api/test/operator").header("Authorization", "Bearer " + engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("OPERATOR"));
    }

    @Test
    void operatorUser_shouldAccessOnlyOperatorEndpoint_andDeniedAdminAndEngineer() throws Exception {
        mockMvc.perform(get("/api/test/admin").header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/test/engineer").header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/test/operator").header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("OPERATOR"));
    }
}
