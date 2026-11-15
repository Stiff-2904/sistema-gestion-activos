package cr.go.ctposa.assetmanagement.exception;

/** El elemento de catalogo tiene registros asociados y no se puede eliminar (HTTP 409). */
public class CatalogItemInUseException extends RuntimeException {
    public CatalogItemInUseException(String message) {
        super(message);
    }
}
