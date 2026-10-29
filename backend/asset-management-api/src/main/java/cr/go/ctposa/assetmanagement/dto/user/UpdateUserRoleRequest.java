package cr.go.ctposa.assetmanagement.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateUserRoleRequest {

    @NotBlank(message = "El rol es obligatorio")
    @Size(max = 50, message = "El rol no puede superar los 50 caracteres")
    private String role;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
