package cr.go.ctposa.assetmanagement.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CatalogTypeTest {

    @Test
    void fromSlug_FindsEachCatalog() {
        assertEquals(CatalogType.STATUS, CatalogType.fromSlug("estados"));
        assertEquals(CatalogType.LOCATION, CatalogType.fromSlug("ubicaciones"));
        assertEquals(CatalogType.CATEGORY, CatalogType.fromSlug("categorias"));
        assertEquals(CatalogType.ACQUISITION_MODE, CatalogType.fromSlug("modos-adquisicion"));
    }

    @Test
    void fromSlug_UnknownOrNull_Throws() {
        assertThrows(IllegalArgumentException.class, () -> CatalogType.fromSlug("usuarios"));
        assertThrows(IllegalArgumentException.class, () -> CatalogType.fromSlug(null));
    }

    @Test
    void onlyLocationRequiresDetail() {
        assertTrue(CatalogType.LOCATION.isDetailRequired());
        assertFalse(CatalogType.STATUS.isDetailRequired());
        assertEquals(50, CatalogType.STATUS.getMaxNameLength());
    }
}
