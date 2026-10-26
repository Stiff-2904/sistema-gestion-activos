package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.user.UpdateUserRequest;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateUserServiceTest {
    @Mock UserRepository users;
    @Mock RoleRepository roles;
    @Mock PasswordEncoder encoder;
    @Mock AuditRepository audits;
    @InjectMocks UserService service;
    UpdateUserRequest input;
    User target;

    @BeforeEach
    void setup() {
        input = new UpdateUserRequest();
        input.setName(" Ana Actualizada ");
        input.setEmail(" ANA@CTPOSA.AC.CR ");
        input.setRole("INTERMEDIATE_USER");
        target = new User();
        ReflectionTestUtils.setField(target,"id",2);
        target.setName("Ana");
        target.setEmail("ana@ctposa.ac.cr");
        target.setPasswordHash("old_hash");
        target.setRole(new Role("BASIC_USER","básico","ASSET_READ"));
        target.setActive(true);
    }

    @AfterEach
    void cleanup() { SecurityContextHolder.clearContext(); }

    private void prepare() {
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(roles.findByName("INTERMEDIATE_USER"))
            .thenReturn(Optional.of(new Role("INTERMEDIATE_USER","intermedio","ASSET_READ")));
        User actor = new User();
        actor.setEmail("admin@ctposa.ac.cr");
        when(users.findByEmail("admin@ctposa.ac.cr")).thenReturn(Optional.of(actor));
        when(users.save(any(User.class))).thenAnswer(call -> call.getArgument(0));
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("admin@ctposa.ac.cr",null,
                List.of(new SimpleGrantedAuthority("ROLE_SUPERUSER"))));
    }

    @Test
    void updatesDataWithoutPasswordAndWritesAudit() {
        prepare();
        var result = service.updateUser(2, input);
        assertEquals("Ana Actualizada", result.getName());
        assertEquals("ana@ctposa.ac.cr", result.getEmail());
        assertEquals("INTERMEDIATE_USER",result.getRole());
        assertEquals("old_hash",target.getPasswordHash());
        verifyNoInteractions(encoder);
        ArgumentCaptor<Audit> audit = ArgumentCaptor.forClass(Audit.class);
        verify(audits).save(audit.capture());
        assertEquals("UPDATE_USER",audit.getValue().getAction());
        assertEquals("usuario",audit.getValue().getAffectedTable());
        assertFalse(audit.getValue().getDetails().contains("old_hash"));
    }

    @Test
    void changingPasswordEncodesItAndDoesNotAuditRawValue() {
        input.setPassword("secretito123");
        prepare();
        when(encoder.encode("secretito123")).thenReturn("new_hash");
        service.updateUser(2,input);
        assertEquals("new_hash",target.getPasswordHash());
        ArgumentCaptor<Audit> audit = ArgumentCaptor.forClass(Audit.class);
        verify(audits).save(audit.capture());
        assertFalse(audit.getValue().getDetails().contains("secretito123"));
        assertFalse(audit.getValue().getDetails().contains("new_hash"));
    }

    @Test
    void rejectsDuplicatedEmailBeforeModifying() {
        input.setEmail("otro@ctposa.ac.cr");
        when(users.findById(2)).thenReturn(Optional.of(target));
        User another = new User();
        ReflectionTestUtils.setField(another,"id",3);
        when(users.findByEmail("otro@ctposa.ac.cr")).thenReturn(Optional.of(another));
        assertThrows(IllegalArgumentException.class,()->service.updateUser(2,input));
        verify(users,never()).save(any(User.class));
        verifyNoInteractions(audits);
    }

    @Test
    void actorMissingMeansNothingSaved() {
        when(users.findById(2)).thenReturn(Optional.of(target));
        when(roles.findByName("INTERMEDIATE_USER"))
            .thenReturn(Optional.of(new Role("INTERMEDIATE_USER","intermedio","ASSET_READ")));
        assertThrows(IllegalStateException.class,()->service.updateUser(2,input));
        verify(users,never()).save(any(User.class));
        verifyNoInteractions(audits);
    }
}
