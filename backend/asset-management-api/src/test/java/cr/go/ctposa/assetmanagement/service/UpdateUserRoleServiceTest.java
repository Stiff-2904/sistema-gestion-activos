package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.user.UpdateUserRoleRequest;
import cr.go.ctposa.assetmanagement.model.Audit;
import cr.go.ctposa.assetmanagement.model.Role;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.AuditRepository;
import cr.go.ctposa.assetmanagement.repository.RoleRepository;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import java.util.List;
import java.util.Optional;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateUserRoleServiceTest {
    @Mock UserRepository users;
    @Mock RoleRepository roles;
    @Mock PasswordEncoder encoder;
    @Mock AuditRepository audits;
    @InjectMocks UserService service;
    UpdateUserRoleRequest input;
    User target;
    User actor;

    @BeforeEach
    void setup() {
        input = new UpdateUserRoleRequest();
        input.setRole("INTERMEDIATE_USER");
        target = new User();
        ReflectionTestUtils.setField(target, "id", 2);
        target.setName("Ana");
        target.setEmail("ana@ctposa.ac.cr");
        target.setPasswordHash("old_hash");
        target.setRole(new Role("BASIC_USER", "basico", "ASSET_READ"));
        target.setActive(true);
        actor = new User();
        ReflectionTestUtils.setField(actor, "id", 1);
        actor.setEmail("admin@ctposa.ac.cr");
    }

    @AfterEach
    void cleanup() { SecurityContextHolder.clearContext(); }

    private void authenticateActor() {
        when(users.findByEmail("admin@ctposa.ac.cr")).thenReturn(Optional.of(actor));
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("admin@ctposa.ac.cr", null,
                List.of(new SimpleGrantedAuthority("ROLE_SUPERUSER"))));
    }

    // CA01: cambio de rol exitoso con auditoria
    @Test
    void updateUserRole_ValidRole_ChangesRoleAndWritesAudit() {
        input.setRole(" INTERMEDIATE_USER ");
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(roles.findByName("INTERMEDIATE_USER"))
            .thenReturn(Optional.of(new Role("INTERMEDIATE_USER", "intermedio", "ASSET_READ")));
        authenticateActor();
        when(users.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        var result = service.updateUserRole(2, input);

        assertEquals(2, result.getId());
        assertEquals("INTERMEDIATE_USER", result.getRole());
        assertEquals("ana@ctposa.ac.cr", result.getEmail());
        assertEquals("INTERMEDIATE_USER", target.getRole().getName());
        assertEquals("old_hash", target.getPasswordHash());
        verifyNoInteractions(encoder);
        verify(users, never()).countByRoleNameAndActive(anyString(), any());

        ArgumentCaptor<Audit> audit = ArgumentCaptor.forClass(Audit.class);
        verify(audits, times(1)).save(audit.capture());
        assertEquals("UPDATE_USER_ROLE", audit.getValue().getAction());
        assertEquals("usuario", audit.getValue().getAffectedTable());
        assertSame(actor, audit.getValue().getUser());
        assertTrue(audit.getValue().getDetails().contains("id=2"));
        assertTrue(audit.getValue().getDetails().contains("rol anterior=BASIC_USER"));
        assertTrue(audit.getValue().getDetails().contains("rol nuevo=INTERMEDIATE_USER"));
        assertFalse(audit.getValue().getDetails().contains("old_hash"));
    }

    // CA03: el rol enviado debe existir, de lo contrario no se guarda nada
    @Test
    void updateUserRole_RoleDoesNotExist_ThrowsAndSavesNothing() {
        input.setRole("NO_EXISTE");
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(roles.findByName("NO_EXISTE")).thenReturn(Optional.empty());

        var error = assertThrows(IllegalArgumentException.class,
            () -> service.updateUserRole(2, input));

        assertEquals("El rol indicado no existe", error.getMessage());
        assertEquals("BASIC_USER", target.getRole().getName());
        verify(users, never()).save(any(User.class));
        verifyNoInteractions(audits);
    }

    // CA04: el ultimo superusuario activo no puede perder su rol
    @Test
    void updateUserRole_LastActiveSuperuser_IsRejectedAndNothingSaved() {
        target.setRole(new Role("SUPERUSER", "super", "ALL"));
        input.setRole("BASIC_USER");
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(roles.findByName("BASIC_USER"))
            .thenReturn(Optional.of(new Role("BASIC_USER", "basico", "ASSET_READ")));
        when(users.countByRoleNameAndActive("SUPERUSER", true)).thenReturn(1L);

        var error = assertThrows(IllegalArgumentException.class,
            () -> service.updateUserRole(2, input));

        assertTrue(error.getMessage().contains("al menos un superusuario"));
        assertEquals("SUPERUSER", target.getRole().getName());
        verify(users, never()).save(any(User.class));
        verifyNoInteractions(audits);
    }

    // CA04: si existe otro superusuario activo, el cambio si se permite
    @Test
    void updateUserRole_SuperuserWhenAnotherExists_ChangesRole() {
        target.setRole(new Role("SUPERUSER", "super", "ALL"));
        input.setRole("BASIC_USER");
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(roles.findByName("BASIC_USER"))
            .thenReturn(Optional.of(new Role("BASIC_USER", "basico", "ASSET_READ")));
        when(users.countByRoleNameAndActive("SUPERUSER", true)).thenReturn(2L);
        authenticateActor();
        when(users.save(any(User.class))).thenAnswer(call -> call.getArgument(0));

        var result = service.updateUserRole(2, input);

        assertEquals("BASIC_USER", result.getRole());
        verify(audits, times(1)).save(any(Audit.class));
    }

    // Prueba adicional: asignar el mismo rol no genera cambio ni auditoria
    @Test
    void updateUserRole_SameRole_ThrowsAndSavesNothing() {
        input.setRole("BASIC_USER");
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(roles.findByName("BASIC_USER"))
            .thenReturn(Optional.of(new Role("BASIC_USER", "basico", "ASSET_READ")));

        assertThrows(IllegalArgumentException.class,
            () -> service.updateUserRole(2, input));

        verify(users, never()).save(any(User.class));
        verifyNoInteractions(audits);
    }

    // Prueba adicional: usuario inexistente
    @Test
    void updateUserRole_UserDoesNotExist_ThrowsAndSavesNothing() {
        when(users.findById(99)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
            () -> service.updateUserRole(99, input));

        verify(users, never()).save(any(User.class));
        verifyNoInteractions(audits);
    }

    // Prueba adicional: sin usuario autenticado no se guarda ningun cambio
    @Test
    void updateUserRole_WithoutAuthenticatedUser_SavesNothing() {
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(roles.findByName("INTERMEDIATE_USER"))
            .thenReturn(Optional.of(new Role("INTERMEDIATE_USER", "intermedio", "ASSET_READ")));

        assertThrows(IllegalStateException.class,
            () -> service.updateUserRole(2, input));

        verify(users, never()).save(any(User.class));
        verifyNoInteractions(audits);
    }
}
