package cr.go.ctposa.assetmanagement.security;

import cr.go.ctposa.assetmanagement.model.Role;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import jakarta.servlet.FilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {
    @Test
    void validToken_UsesCurrentRoleFromDatabase() throws Exception {
        JwtService jwt = mock(JwtService.class);
        UserRepository repository = mock(UserRepository.class);
        when(jwt.isValid("valid-token")).thenReturn(true);
        when(jwt.extractEmail("valid-token")).thenReturn("ana@ctposa.ac.cr");
        User user = new User();
        user.setEmail("ana@ctposa.ac.cr");
        user.setActive(true);
        user.setRole(new Role("BASIC_USER", "Básico", "ASSET_READ"));
        when(repository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        var filter = new JwtAuthenticationFilter(jwt, repository);
        final boolean[] visited = { false };
        FilterChain chain = (req,res) -> {
            visited[0] = true;
            var auth = SecurityContextHolder.getContext().getAuthentication();
            assertNotNull(auth);
            assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_BASIC_USER")));
            assertFalse(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPERUSER")));
        };
        filter.doFilter(request, new MockHttpServletResponse(), chain);
        assertTrue(visited[0]);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void inactiveAccount_CannotUseValidJwt() throws Exception {
        JwtService jwt = mock(JwtService.class);
        UserRepository repository = mock(UserRepository.class);
        when(jwt.isValid("valid-token")).thenReturn(true);
        when(jwt.extractEmail("valid-token")).thenReturn("ana@ctposa.ac.cr");
        User user = new User();
        user.setEmail("ana@ctposa.ac.cr");
        user.setActive(false);
        when(repository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        FilterChain chain = (req,res) ->
            assertNull(SecurityContextHolder.getContext().getAuthentication());
        new JwtAuthenticationFilter(jwt, repository).doFilter(request, new MockHttpServletResponse(), chain);
    }

    @Test
    void invalidToken_IsUnauthenticated() throws Exception {
        JwtService jwt = mock(JwtService.class);
        UserRepository repository = mock(UserRepository.class);
        when(jwt.isValid("bad-token")).thenReturn(false);
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer bad-token");
        FilterChain chain = (req,res) ->
            assertNull(SecurityContextHolder.getContext().getAuthentication());
        new JwtAuthenticationFilter(jwt, repository).doFilter(request, new MockHttpServletResponse(), chain);
        verifyNoInteractions(repository);
    }
}
