package cr.go.ctposa.assetmanagement.model;

/** Catalogos administrables. El slug es el valor que viaja en la URL. */
public enum CatalogType {

    STATUS("estados", "estado", 50, false),
    LOCATION("ubicaciones", "ubicacion", 100, true),
    CATEGORY("categorias", "categoria", 100, false),
    ACQUISITION_MODE("modos-adquisicion", "modo_adquisicion", 100, false);

    private final String slug;
    private final String table;
    private final int maxNameLength;
    private final boolean detailRequired;

    CatalogType(String slug, String table, int maxNameLength, boolean detailRequired) {
        this.slug = slug;
        this.table = table;
        this.maxNameLength = maxNameLength;
        this.detailRequired = detailRequired;
    }

    public String getSlug() {
        return slug;
    }

    public String getTable() {
        return table;
    }

    public int getMaxNameLength() {
        return maxNameLength;
    }

    /** En ubicacion el edificio es obligatorio (columna NOT NULL). */
    public boolean isDetailRequired() {
        return detailRequired;
    }

    public static CatalogType fromSlug(String slug) {
        for (CatalogType type : values()) {
            if (type.slug.equalsIgnoreCase(slug == null ? "" : slug.trim())) {
                return type;
            }
        }
        throw new IllegalArgumentException("Catalogo no reconocido: " + slug);
    }
}
