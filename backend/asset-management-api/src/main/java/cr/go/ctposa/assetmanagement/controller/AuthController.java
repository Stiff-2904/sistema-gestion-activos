package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.auth.LoginRequest;
import cr.go.ctposa.assetmanagement.dto.auth.LoginResponse;
import cr.go.ctposa.assetmanagement.dto.auth.CurrentUserResponse;
import org.springframework.security.core.Authentication;
import cr.go.ctposa.assetmanagement.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.currentUser(authentication.getName()));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        LoginResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }
}
