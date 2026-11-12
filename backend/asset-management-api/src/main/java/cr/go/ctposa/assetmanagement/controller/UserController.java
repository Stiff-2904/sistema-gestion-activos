package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.user.CreateUserRequest;
import cr.go.ctposa.assetmanagement.dto.user.CreateUserResponse;
import cr.go.ctposa.assetmanagement.dto.user.DeleteUserPreviewResponse;
import cr.go.ctposa.assetmanagement.dto.user.DeleteUserResponse;
import cr.go.ctposa.assetmanagement.dto.user.UpdateUserRequest;
import cr.go.ctposa.assetmanagement.dto.user.UpdateUserRoleRequest;
import cr.go.ctposa.assetmanagement.dto.user.UpdateUserStatusRequest;
import cr.go.ctposa.assetmanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<CreateUserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request) {

        CreateUserResponse response = userService.createUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<CreateUserResponse> updateUser(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<CreateUserResponse> updateUserRole(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(userService.updateUserRole(id, request));
    }
    /** HU-GU-06: consultar si la eliminación definitiva está permitida. */
    @GetMapping("/{id}/deletion")
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<DeleteUserPreviewResponse> getDeletionPreview(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getDeletionPreview(id));
    }

    /** HU-GU-06: eliminar definitivamente una cuenta elegible. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<DeleteUserResponse> deleteUser(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.deleteUser(id));
    }

    /** HU-GU-05: consultar el estado REAL de la cuenta antes de mostrar la accion. */
    @GetMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<CreateUserResponse> getUserStatus(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getUserStatus(id));
    }

    /** HU-GU-05: activar o inactivar sin borrar datos personales. */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<CreateUserResponse> updateUserStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(userService.updateUserStatus(id, request));
    }
}