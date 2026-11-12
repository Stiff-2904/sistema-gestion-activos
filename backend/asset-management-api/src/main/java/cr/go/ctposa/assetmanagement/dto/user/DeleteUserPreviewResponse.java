package cr.go.ctposa.assetmanagement.dto.user;

/** Los datos de consulta no incluyen contraseñas ni hashes. */
public record DeleteUserPreviewResponse(
        Integer id, String name, String email, String role,
        boolean active, boolean canDelete, String message) {
}
