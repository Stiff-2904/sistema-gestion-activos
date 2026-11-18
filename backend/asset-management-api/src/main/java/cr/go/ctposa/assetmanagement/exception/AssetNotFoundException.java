package cr.go.ctposa.assetmanagement.exception;

/** Recurso no encontrado: la consulta por ID debe devolver HTTP 404. */
public class AssetNotFoundException extends RuntimeException {
    public AssetNotFoundException(Integer id) {
        super("El activo con ID " + id + " no existe.");
    }
}
