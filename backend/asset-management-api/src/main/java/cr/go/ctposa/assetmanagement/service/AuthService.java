package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.auth.LoginRequest;
import cr.go.ctposa.assetmanagement.dto.auth.LoginResponse;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import cr.go.ctposa.assetmanagement.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Locale;
import cr.go.ctposa.assetmanagement.dto.auth.CurrentUserResponse;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public User authenticate(LoginRequest request) {

        User user = userRepository
                .findByEmail(request.getEmail().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() ->
                        new BadCredentialsException(
                                "Correo o contrasena incorrectos"
                        )
                );

        if (!user.getActive()) {
            throw new BadCredentialsException(
                    "El usuario esta inactivo"
            );
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash())) {

            throw new BadCredentialsException(
                    "Correo o contrasena incorrectos"
            );
        }

        return user;
    }

    public CurrentUserResponse currentUser(String email) {
        User user = userRepository.findByEmail(email)
                .filter(value -> Boolean.TRUE.equals(value.getActive()))
                .orElseThrow(() -> new BadCredentialsException("Sesión no válida"));
        return new CurrentUserResponse(
                user.getId(), user.getName(), user.getEmail(), user.getRole().getName());
    }

    public LoginResponse login(LoginRequest request) {

        User user = authenticate(request);

        String token = jwtService.generateToken(user);

        return new LoginResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().getName()
        );
    }
}
