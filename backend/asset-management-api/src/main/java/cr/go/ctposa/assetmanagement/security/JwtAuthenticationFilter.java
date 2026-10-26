package cr.go.ctposa.assetmanagement.security;

import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
                                    throws ServletException, IOException {
        try {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                if (jwtService.isValid(token)) {
                    String email = jwtService.extractEmail(token);
                    Optional<User> matching = userRepository.findByEmail(email);
                    if (matching.isPresent()) {
                        User user = matching.get();
                        // Consultar BD impide que un token antiguo conserve privilegios
                        // despues de desactivar al usuario o cambiarle el rol.
                        if (Boolean.TRUE.equals(user.getActive()) && user.getRole() != null) {
                            List<SimpleGrantedAuthority> permissions = new ArrayList<>();
                            permissions.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));
                            String text = user.getRole().getPermissions();
                            if (text != null && !text.isBlank()) {
                                for (String item : text.split(",")) {
                                    if (!item.trim().isEmpty()) {
                                        permissions.add(new SimpleGrantedAuthority(item.trim()));
                                    }
                                }
                            }
                            SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(user.getEmail(), null, permissions));
                        }
                    }
                }
            }
        } catch (RuntimeException ignored) {
            // Token no válido o cuenta no disponible: continuar sin autenticación.
            SecurityContextHolder.clearContext();
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
