package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.user.UpdateUserStatusRequest;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateUserStatusServiceTest {
    @Mock UserRepository users;
    @Mock RoleRepository roles;
    @Mock PasswordEncoder passwords;
    @Mock AuditRepository audits;
    @InjectMocks UserService service;
    User target;
    User actor;
    UpdateUserStatusRequest request;

    @BeforeEach
    void setUp() {
        target = new User();
        ReflectionTestUtils.setField(target, "id", 2);
        target.setName("Ana");
        target.setEmail("ana@ctposa.ac.cr");
        target.setPasswordHash("hash_privado");
        target.setRole(new Role("BASIC_USER", "basico", "ASSET_READ"));
        target.setActive(true);
        actor = new User();
        ReflectionTestUtils.setField(actor, "id", 1);
        actor.setEmail("admin@ctposa.ac.cr");
        request = new UpdateUserStatusRequest();
        request.setActive(false);
        request.setReason("Permiso temporal solicitado");
    }

    @AfterEach
    void clear() { SecurityContextHolder.clearContext(); }

    private void authenticateAdmin() {
        when(users.findByEmail("admin@ctposa.ac.cr")).thenReturn(Optional.of(actor));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@ctposa.ac.cr", null,
                        List.of(new SimpleGrantedAuthority("ROLE_SUPERUSER"))));
    }

    @Test
    void ca01_DeactivateSavesStateAndAudit() {
        when(users.findById(2)).thenReturn(Optional.of(target));
        authenticateAdmin();
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.updateUserStatus(2, request);

        assertFalse(result.getActive());
        assertFalse(target.getActive());
        assertEquals("hash_privado", target.getPasswordHash());
        assertEquals(2, result.getId());
        verifyNoInteractions(passwords, roles);
        verify(users).save(target);
        ArgumentCaptor<Audit> captor = ArgumentCaptor.forClass(Audit.class);
        verify(audits).save(captor.capture());
        assertEquals("DEACTIVATE_USER", captor.getValue().getAction());
        assertEquals("usuario", captor.getValue().getAffectedTable());
        assertSame(actor, captor.getValue().getUser());
        assertTrue(captor.getValue().getDetails().contains("id=2"));
        assertTrue(captor.getValue().getDetails().contains("estado anterior=activo"));
        assertTrue(captor.getValue().getDetails().contains("estado nuevo=inactivo"));
        assertTrue(captor.getValue().getDetails().contains("motivo=Permiso temporal solicitado"));
        assertFalse(captor.getValue().getDetails().contains("hash_privado"));
    }

    @Test
    void ca02_ActivateSavesStateAndAudit() {
        target.setActive(false);
        request.setActive(true);
        when(users.findById(2)).thenReturn(Optional.of(target));
        authenticateAdmin();
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.updateUserStatus(2, request);

        assertTrue(result.getActive());
        assertTrue(target.getActive());
        ArgumentCaptor<Audit> captor = ArgumentCaptor.forClass(Audit.class);
        verify(audits).save(captor.capture());
        assertEquals("ACTIVATE_USER", captor.getValue().getAction());
        assertTrue(captor.getValue().getDetails().contains("estado anterior=inactivo"));
        assertTrue(captor.getValue().getDetails().contains("estado nuevo=activo"));
    }

    @Test
    void noReasonMeansNoPersistence() {
        request.setReason("   ");
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.updateUserStatus(2, request));
        assertTrue(error.getMessage().contains("motivo"));
        verify(users, never()).save(any());
        verifyNoInteractions(audits);
    }

    @Test
    void missingStatusMeansNoPersistence() {
        request.setActive(null);
        assertThrows(IllegalArgumentException.class,
                () -> service.updateUserStatus(2, request));
        verifyNoInteractions(users, audits);
    }

    @Test
    void statusSameAsBeforeIsRejected() {
        request.setActive(true);
        when(users.findById(2)).thenReturn(Optional.of(target));
        assertThrows(IllegalArgumentException.class,
                () -> service.updateUserStatus(2, request));
        verify(users, never()).save(any());
        verifyNoInteractions(audits);
    }

    @Test
    void cannotInactivateLastActiveSuperuser() {
        target.setRole(new Role("SUPERUSER", "super", "ALL"));
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(users.countByRoleNameAndActive("SUPERUSER", true)).thenReturn(1L);
        var error = assertThrows(IllegalArgumentException.class,
                () -> service.updateUserStatus(2, request));
        assertTrue(error.getMessage().contains("ultimo superusuario"));
        assertTrue(target.getActive());
        verify(users, never()).save(any());
        verifyNoInteractions(audits);
    }

    @Test
    void canInactivateSuperuserWhenAnotherAdminExists() {
        target.setRole(new Role("SUPERUSER", "super", "ALL"));
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(users.countByRoleNameAndActive("SUPERUSER", true)).thenReturn(2L);
        authenticateAdmin();
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        assertFalse(service.updateUserStatus(2, request).getActive());
        verify(audits).save(any(Audit.class));
    }

    @Test
    void actorIsRequired() {
        when(users.findById(2)).thenReturn(Optional.of(target));
        assertThrows(IllegalStateException.class,
                () -> service.updateUserStatus(2, request));
        verify(users, never()).save(any());
        verifyNoInteractions(audits);
    }

    @Test
    void userNotFound() {
        when(users.findById(77)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> service.updateUserStatus(77, request));
        verifyNoInteractions(audits);
    }

    @Test
    void getStatusReturnsRealStateWithoutPassword() {
        target.setActive(false);
        when(users.findById(2)).thenReturn(Optional.of(target));
        var result = service.getUserStatus(2);
        assertEquals(2, result.getId());
        assertEquals("ana@ctposa.ac.cr", result.getEmail());
        assertFalse(result.getActive());
        verify(users, never()).save(any());
        verifyNoInteractions(audits);
    }
}
