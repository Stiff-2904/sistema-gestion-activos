package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.exception.UserDeletionConflictException;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteUserServiceTest {
    @Mock UserRepository users;
    @Mock RoleRepository roles;
    @Mock PasswordEncoder passwords;
    @Mock AuditRepository audits;
    @InjectMocks UserService service;
    User target;
    User actor;

    @BeforeEach
    void setUp() {
        target = new User();
        ReflectionTestUtils.setField(target, "id", 2);
        target.setName("Ana");
        target.setEmail("ana@ctposa.ac.cr");
        target.setPasswordHash("clave_privada_hash");
        target.setRole(new Role("BASIC_USER", "Usuario básico", "ASSET_READ"));
        target.setActive(false);

        actor = new User();
        ReflectionTestUtils.setField(actor, "id", 1);
        actor.setEmail("admin@ctposa.ac.cr");
    }

    @AfterEach
    void clean() { SecurityContextHolder.clearContext(); }

    private void authenticateAdmin() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@ctposa.ac.cr", null,
                        List.of(new SimpleGrantedAuthority("ROLE_SUPERUSER"))));
        when(users.findByEmail("admin@ctposa.ac.cr")).thenReturn(Optional.of(actor));
    }

    @Test
    void ca01DeletesEligibleInactiveAccountAndAuditsWithoutPassword() {
        when(users.findByIdForUpdate(2)).thenReturn(Optional.of(target));
        authenticateAdmin();

        var response = service.deleteUser(2);

        assertEquals(2, response.id());
        verify(users).delete(target);
        verify(users).flush();
        ArgumentCaptor<Audit> captor = ArgumentCaptor.forClass(Audit.class);
        verify(audits).save(captor.capture());
        Audit audit = captor.getValue();
        assertSame(actor, audit.getUser());
        assertEquals("DELETE_USER", audit.getAction());
        assertEquals("usuario", audit.getAffectedTable());
        assertTrue(audit.getDetails().contains("id=2"));
        assertFalse(audit.getDetails().contains("clave_privada_hash"));
    }

    @Test
    void ca03EnabledUserCannotBeDeleted() {
        target.setActive(true);
        when(users.findByIdForUpdate(2)).thenReturn(Optional.of(target));
        authenticateAdmin();
        var error = assertThrows(UserDeletionConflictException.class, () -> service.deleteUser(2));
        assertTrue(error.getMessage().contains("habilitado"));
        verify(users, never()).delete(any(User.class));
        verify(users, never()).flush();
        verify(audits, never()).save(any());
    }

    @Test
    void ca04AccountWithHistoricalAuditCannotBeDeleted() {
        when(users.findByIdForUpdate(2)).thenReturn(Optional.of(target));
        authenticateAdmin();
        when(audits.existsByUser_Id(2)).thenReturn(true);
        var error = assertThrows(UserDeletionConflictException.class, () -> service.deleteUser(2));
        assertTrue(error.getMessage().contains("actividad histórica"));
        verify(users, never()).delete(any(User.class));
        verify(users, never()).flush();
        verify(audits, never()).save(any());
    }

    @Test
    void cannotDeleteOwnAccount() {
        when(users.findByIdForUpdate(1)).thenReturn(Optional.of(actor));
        authenticateAdmin();
        var error = assertThrows(UserDeletionConflictException.class, () -> service.deleteUser(1));
        assertTrue(error.getMessage().contains("propia cuenta"));
        verify(users, never()).delete(any(User.class));
        verify(users, never()).flush();
    }

    @Test
    void foreignKeyHistoryConflictBecomes409DomainError() {
        when(users.findByIdForUpdate(2)).thenReturn(Optional.of(target));
        authenticateAdmin();
        // Simula el fallo de integridad al sincronizar la eliminación con MySQL.
        doThrow(new DataIntegrityViolationException("foreign key")).when(users).flush();
        var error = assertThrows(UserDeletionConflictException.class, () -> service.deleteUser(2));
        assertTrue(error.getMessage().contains("registros relacionados"));
        verify(users).delete(target);
        verify(users).flush();
        verify(audits, never()).save(any());
    }

    @Test
    void absentUserFailsWithoutDeletion() {
        when(users.findByIdForUpdate(20)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.deleteUser(20));
        verify(users, never()).delete(any(User.class));
        verify(users, never()).flush();
        verifyNoInteractions(audits);
    }

    @Test
    void noActorFailsWithoutDeletion() {
        when(users.findByIdForUpdate(2)).thenReturn(Optional.of(target));
        assertThrows(IllegalStateException.class, () -> service.deleteUser(2));
        verify(users, never()).delete(any(User.class));
        verify(users, never()).flush();
        verifyNoInteractions(audits);
    }

    @Test
    void previewReturnsEligibilityWithoutExposingHash() {
        when(users.findById(2)).thenReturn(Optional.of(target));
        authenticateAdmin();
        var response = service.getDeletionPreview(2);
        assertTrue(response.canDelete());
        assertFalse(response.active());
        assertEquals("ana@ctposa.ac.cr", response.email());
        assertFalse(response.toString().contains("clave_privada_hash"));
        verify(users, never()).delete(any(User.class));
        verify(users, never()).flush();
    }

    @Test
    void previewMarksHistoricalAccountAsBlocked() {
        when(users.findById(2)).thenReturn(Optional.of(target));
        authenticateAdmin();
        when(audits.existsByUser_Id(2)).thenReturn(true);
        var response = service.getDeletionPreview(2);
        assertFalse(response.canDelete());
        assertTrue(response.message().contains("histórica"));
    }
}