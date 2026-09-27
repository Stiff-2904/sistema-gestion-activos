package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.auth.LoginRequest;
import cr.go.ctposa.assetmanagement.dto.auth.LoginResponse;
import cr.go.ctposa.assetmanagement.model.Role;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import cr.go.ctposa.assetmanagement.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User mockUser;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        Role role = new Role("BASIC_USER", "Usuario normal", "NONE");
        
        mockUser = new User();
        // Usamos ReflectionTestUtils para asignar el ID sin necesitar setId()
        ReflectionTestUtils.setField(mockUser, "id", 1);
        mockUser.setName("Juan");
        mockUser.setEmail("juan@ctposa.ac.cr");
        mockUser.setPasswordHash("hashed_password");
        mockUser.setRole(role);
        mockUser.setActive(true);

        loginRequest = new LoginRequest();
        loginRequest.setEmail("juan@ctposa.ac.cr");
        loginRequest.setPassword("123456");
    }

    @Test
    void login_ValidCredentials_ReturnsLoginResponse() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), mockUser.getPasswordHash())).thenReturn(true);
        when(jwtService.generateToken(mockUser)).thenReturn("mock.jwt.token");

        LoginResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("juan@ctposa.ac.cr", response.getEmail());
        assertEquals("BASIC_USER", response.getRole());
        
        verify(jwtService, times(1)).generateToken(mockUser);
    }

    @Test
    void login_InvalidPassword_ThrowsBadCredentialsException() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), mockUser.getPasswordHash())).thenReturn(false);

        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
            authService.login(loginRequest);
        });

        assertEquals("Correo o contrasena incorrectos", exception.getMessage());
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void login_InactiveUser_ThrowsBadCredentialsException() {
        mockUser.setActive(false);
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(mockUser));

        BadCredentialsException exception = assertThrows(BadCredentialsException.class, () -> {
            authService.login(loginRequest);
        });

        assertEquals("El usuario esta inactivo", exception.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
}