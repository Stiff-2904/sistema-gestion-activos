package cr.go.ctposa.assetmanagement.dto.auth;

/** No expone el JWT ni la contraseña. */
public record CurrentUserResponse(Integer id, String name, String email, String role) { }
