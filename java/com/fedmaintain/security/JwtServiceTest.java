package com.fedmaintain.security;

import com.fedmaintain.user.entity.Role;
import com.fedmaintain.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private JwtService jwtService;
    private CustomUserDetails userDetails;

    @BeforeEach
    void setUp() {
        // Standard 256-bit test secret
        String testSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        jwtService = new JwtService(testSecret, 3600000); // 1 hour

        User user = User.builder()
                .id(1L)
                .name("Test Engineer")
                .email("engineer@fedmaintain.com")
                .password("encoded_pass")
                .role(Role.ENGINEER)
                .enabled(true)
                .build();
        userDetails = new CustomUserDetails(user);
    }

    @Test
    void generateToken_shouldProduceValidToken() {
        String token = jwtService.generateToken(userDetails);
        assertNotNull(token);
        assertFalse(token.isEmpty());

        String username = jwtService.extractUsername(token);
        assertEquals("engineer@fedmaintain.com", username);

        assertTrue(jwtService.isTokenValid(token, userDetails));
        assertFalse(jwtService.isTokenExpired(token));
    }

    @Test
    void isTokenValid_shouldReturnFalseForWrongUser() {
        String token = jwtService.generateToken(userDetails);

        User anotherUser = User.builder()
                .id(2L)
                .name("Other User")
                .email("other@fedmaintain.com")
                .password("encoded_pass")
                .role(Role.OPERATOR)
                .enabled(true)
                .build();
        CustomUserDetails otherDetails = new CustomUserDetails(anotherUser);

        assertFalse(jwtService.isTokenValid(token, otherDetails));
    }
}
