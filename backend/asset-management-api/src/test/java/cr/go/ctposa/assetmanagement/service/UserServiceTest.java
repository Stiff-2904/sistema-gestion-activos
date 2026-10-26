package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.user.CreateUserRequest;
import cr.go.ctposa.assetmanagement.dto.user.CreateUserResponse;
import cr.go.ctposa.assetmanagement.model.Audit;
import cr.go.ctposa.assetmanagement.model.Role;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.AuditRepository;
import cr.go.ctposa.assetmanagement.repository.RoleRepository;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    private static final String ACTOR_EMAIL = "admin@ctposa.ac.cr";

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditRepository auditRepository;

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

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAsSuperuser() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        ACTOR_EMAIL,
                        null,
                        List.of(new SimpleGrantedAuthority("ALL"))
                )
        );
    }

    private void prepareSuccessfulCreation() {
        when(userRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.empty());
        when(roleRepository.findByName(request.getRole()))
                .thenReturn(Optional.of(mockRole));
        User actor = new User();
        ReflectionTestUtils.setField(actor, "id", 1);
        actor.setEmail(ACTOR_EMAIL);
        actor.setRole(new Role("SUPERUSER", "Superusuario", "ALL"));
        when(userRepository.findByEmail(ACTOR_EMAIL))
                .thenReturn(Optional.of(actor));
        when(passwordEncoder.encode(request.getPassword()))
                .thenReturn("generated_hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User newUser = invocation.getArgument(0);
            ReflectionTestUtils.setField(newUser, "id", 2);
            return newUser;
        });
    }

    @Test
    void createUser_ValidRequest_SavesUserAndAuditAndReturnsResponse() {
        authenticateAsSuperuser();
        prepareSuccessfulCreation();

        CreateUserResponse response = userService.createUser(request);

        assertNotNull(response);
        assertEquals(2, response.getId());
        assertEquals("Ana", response.getName());
        assertEquals(request.getEmail(), response.getEmail());
        assertEquals("BASIC_USER", response.getRole());
        assertTrue(response.getActive());

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(savedUser.capture());
        assertEquals("generated_hash", savedUser.getValue().getPasswordHash());
        assertNotEquals(request.getPassword(), savedUser.getValue().getPasswordHash());
        assertSame(mockRole, savedUser.getValue().getRole());

        ArgumentCaptor<Audit> savedAudit = ArgumentCaptor.forClass(Audit.class);
        verify(auditRepository, times(1)).save(savedAudit.capture());
        assertEquals(ACTOR_EMAIL, savedAudit.getValue().getUser().getEmail());
        assertEquals("CREATE_USER", savedAudit.getValue().getAction());
        assertEquals("usuario", savedAudit.getValue().getAffectedTable());
        assertTrue(savedAudit.getValue().getDetails().contains("ana@ctposa.ac.cr"));
        assertFalse(savedAudit.getValue().getDetails().contains("123456"));
    }

    @Test
    void createUser_EmailAlreadyExists_ThrowsIllegalArgumentException() {
        User existingUser = new User();
        when(userRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.of(existingUser));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userService.createUser(request)
        );

        assertEquals("Ya existe un usuario con ese correo", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
        verify(auditRepository, never()).save(any(Audit.class));
    }

    @Test
    void createUser_UnknownRole_ThrowsIllegalArgumentException() {
        when(userRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.empty());
        when(roleRepository.findByName(request.getRole()))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userService.createUser(request)
        );

        assertEquals("El rol indicado no existe", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
        verify(auditRepository, never()).save(any(Audit.class));
    }

    @Test
    void createUser_WithoutAuthenticatedActor_DoesNotSaveUser() {
        when(userRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.empty());
        when(roleRepository.findByName(request.getRole()))
                .thenReturn(Optional.of(mockRole));

        assertThrows(IllegalStateException.class,
                () -> userService.createUser(request));
        verify(userRepository, never()).save(any(User.class));
        verify(auditRepository, never()).save(any(Audit.class));
    }

    @Test
    void createUser_IntermediateRole_UsesRoleSelectedBySuperuser() {
        request.setRole("INTERMEDIATE_USER");
        mockRole = new Role("INTERMEDIATE_USER", "Usuario intermedio", "ASSET_READ");
        authenticateAsSuperuser();
        prepareSuccessfulCreation();

        CreateUserResponse response = userService.createUser(request);

        assertEquals("INTERMEDIATE_USER", response.getRole());
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertSame(mockRole, captor.getValue().getRole());
        verify(auditRepository).save(any(Audit.class));
    }

    @Test
    void createUser_EmailWithSpacesAndUppercase_IsNormalized() {
        request.setEmail("  Ana@CTPOSA.AC.CR  ");
        authenticateAsSuperuser();
        when(userRepository.findByEmail("ana@ctposa.ac.cr")).thenReturn(Optional.empty());
        when(roleRepository.findByName("BASIC_USER")).thenReturn(Optional.of(mockRole));
        User actor = new User();
        actor.setEmail(ACTOR_EMAIL);
        when(userRepository.findByEmail(ACTOR_EMAIL)).thenReturn(Optional.of(actor));
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User result = invocation.getArgument(0);
            ReflectionTestUtils.setField(result, "id", 3);
            return result;
        });

        CreateUserResponse response = userService.createUser(request);

        assertEquals("ana@ctposa.ac.cr", response.getEmail());
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("ana@ctposa.ac.cr", captor.getValue().getEmail());
    }

    @Test
    void createUser_NormalizedEmailAlreadyExists_DoesNotSave() {
        request.setEmail("  Ana@CTPOSA.AC.CR  ");
        when(userRepository.findByEmail("ana@ctposa.ac.cr"))
                .thenReturn(Optional.of(new User()));

        assertThrows(IllegalArgumentException.class, () -> userService.createUser(request));

        verifyNoInteractions(auditRepository);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_AuthenticatedActorNotInDatabase_DoesNotSave() {
        authenticateAsSuperuser();
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(roleRepository.findByName(request.getRole())).thenReturn(Optional.of(mockRole));
        when(userRepository.findByEmail(ACTOR_EMAIL)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> userService.createUser(request));

        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(auditRepository);
    }

    @Test
    void createUser_AuditFailure_PropagatesErrorForTransactionRollback() {
        authenticateAsSuperuser();
        prepareSuccessfulCreation();
        when(auditRepository.save(any(Audit.class))).thenThrow(new IllegalStateException("auditoria no disponible"));

        assertThrows(IllegalStateException.class, () -> userService.createUser(request));

        verify(userRepository).save(any(User.class));
        verify(auditRepository).save(any(Audit.class));
        // La reversión REAL de MySQL corresponde a @Transactional y se verifica en integración.
    }

}
