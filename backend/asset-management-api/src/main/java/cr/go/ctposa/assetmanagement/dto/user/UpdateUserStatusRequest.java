package cr.go.ctposa.assetmanagement.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** HU-GU-05: estado deseado y motivo obligatorio del cambio. */
public class UpdateUserStatusRequest {

    @NotNull(message = "Debe indicar el estado del usuario")
    private Boolean active;

    @NotBlank(message = "Debe indicar un motivo para el cambio de estado")
    @Size(max = 500, message = "El motivo no puede superar los 500 caracteres")
    private String reason;

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
