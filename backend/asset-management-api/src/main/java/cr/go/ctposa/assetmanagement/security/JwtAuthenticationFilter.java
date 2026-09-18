package cr.go.ctposa.assetmanagement.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(7);

        if (!jwtService.isValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        Claims claims = jwtService.extractClaims(token);

        String email = claims.getSubject();
        String role = claims.get("role", String.class);
        String permissions = claims.get("permissions", String.class);

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        if (role != null && !role.isBlank()) {
            authorities.add(
                    new SimpleGrantedAuthority("ROLE_" + role)
            );
        }

        if (permissions != null && !permissions.isBlank()) {

            String[] permissionList = permissions.split(",");

            for (String permission : permissionList) {

                String trimmedPermission = permission.trim();

                if (!trimmedPermission.isBlank()) {
                    authorities.add(
                            new SimpleGrantedAuthority(trimmedPermission)
                    );
                }
            }
        }

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        authorities
                );

        SecurityContextHolder.getContext()
                .setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}