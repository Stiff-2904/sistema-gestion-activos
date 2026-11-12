package cr.go.ctposa.assetmanagement.exception;

/** Regla de negocio que impide la eliminación definitiva (HTTP 409). */
public class UserDeletionConflictException extends RuntimeException {
    public UserDeletionConflictException(String message) {
        super(message);
    }
}
