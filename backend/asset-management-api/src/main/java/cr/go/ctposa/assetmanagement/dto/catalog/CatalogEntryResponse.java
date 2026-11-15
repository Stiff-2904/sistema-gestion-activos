package cr.go.ctposa.assetmanagement.dto.catalog;

/** Elemento de catalogo con la cantidad de activos que lo usan. */
public record CatalogEntryResponse(Integer id, String name, String detail, long usageCount, boolean deletable) {
}
