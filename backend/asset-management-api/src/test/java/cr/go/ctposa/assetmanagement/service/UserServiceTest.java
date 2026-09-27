package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.user.CreateUserRequest;
import cr.go.ctposa.assetmanagement.dto.user.CreateUserResponse;
import cr.go.ctposa.assetmanagement.model.Role;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.RoleRepository;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private CreateUserRequest request;
    private Role mockRole;

    @BeforeEach
    void setUp() {
        request = new CreateUserRequest();
        request.setName("Ana");
        request.setEmail("ana@ctposa.ac.cr");
        request.setPassword("123456");
        request.setRole("BASIC_USER");

        mockRole = new Role("BASIC_USER", "Usuario basico", "NONE");
    }

    @Test
    void createUser_ValidRequest_SavesUserAndReturnsResponse() {
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(roleRepository.findByName(request.getRole())).thenReturn(Optional.of(mockRole));
        when(passwordEncoder.encode(request.getPassword())).thenReturn("generated_hash");
        
        User savedUser = new User();

        ReflectionTestUtils.setField(savedUser, "id", 2);
        savedUser.setName(request.getName());
        savedUser.setEmail(request.getEmail());
        savedUser.setRole(mockRole);
        savedUser.setActive(true);
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        CreateUserResponse response = userService.createUser(request);

        assertNotNull(response);
        assertEquals(2, response.getId());
        assertEquals("Ana", response.getName());
        assertTrue(response.getActive());
        
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void createUser_EmailAlreadyExists_ThrowsIllegalArgumentException() {
        User existingUser = new User();
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(existingUser));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userService.createUser(request);
        });

        assertEquals("Ya existe un usuario con ese correo", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }
}
