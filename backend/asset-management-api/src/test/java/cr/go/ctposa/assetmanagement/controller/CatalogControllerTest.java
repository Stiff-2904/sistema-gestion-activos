package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.catalog.CatalogDeleteResponse;
import cr.go.ctposa.assetmanagement.dto.catalog.CatalogEntryRequest;
import cr.go.ctposa.assetmanagement.dto.catalog.CatalogEntryResponse;
import cr.go.ctposa.assetmanagement.exception.CatalogItemInUseException;
import cr.go.ctposa.assetmanagement.exception.GlobalExceptionHandler;
import cr.go.ctposa.assetmanagement.model.CatalogType;
import cr.go.ctposa.assetmanagement.service.CatalogService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CatalogControllerTest {

    // CA01: listar responde 200 con los elementos
    @Test
    void list_ReturnsHttp200WithEntries() {
        CatalogService service = mock(CatalogService.class);
        List<CatalogEntryResponse> expected = List.of(new CatalogEntryResponse(1, "Aula 1", "Edificio A", 0, true));
        when(service.list(CatalogType.LOCATION)).thenReturn(expected);

        ResponseEntity<List<CatalogEntryResponse>> result = new CatalogController(service).list("ubicaciones");

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertSame(expected, result.getBody());
    }

    // CA02: crear responde 201
    @Test
    void create_ReturnsHttp201() {
        CatalogService service = mock(CatalogService.class);
        CatalogEntryRequest request = new CatalogEntryRequest("Aula 9", "Edificio B");
        CatalogEntryResponse expected = new CatalogEntryResponse(9, "Aula 9", "Edificio B", 0, true);
        when(service.create(CatalogType.LOCATION, request)).thenReturn(expected);

        ResponseEntity<CatalogEntryResponse> result = new CatalogController(service).create("ubicaciones", request);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertSame(expected, result.getBody());
    }

    // CA04: eliminar responde 200 con mensaje
    @Test
    void delete_ReturnsHttp200() {
        CatalogService service = mock(CatalogService.class);
        when(service.delete(CatalogType.CATEGORY, 3)).thenReturn(new CatalogDeleteResponse("ok"));

        ResponseEntity<CatalogDeleteResponse> result = new CatalogController(service).delete("categorias", 3);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals("ok", result.getBody().message());
    }

    // CA05: elemento en uso se traduce a 409
    @Test
    void handler_ItemInUse_ReturnsHttp409() {
        ResponseEntity<Map<String, Object>> result = new GlobalExceptionHandler()
            .handleCatalogInUse(new CatalogItemInUseException("En uso"));

        assertEquals(HttpStatus.CONFLICT, result.getStatusCode());
        assertEquals("En uso", result.getBody().get("message"));
    }

    // CA06: catalogo desconocido es un error 400 (IllegalArgumentException)
    @Test
    void unknownCatalog_Throws() {
        CatalogService service = mock(CatalogService.class);
        assertThrows(IllegalArgumentException.class, () -> new CatalogController(service).list("otro"));
    }

    // CA06: el usuario basico no tiene acceso
    @Test
    void controller_RequiresSuperuserOrIntermediateRole() {
        PreAuthorize security = CatalogController.class.getAnnotation(PreAuthorize.class);
        assertNotNull(security);
        assertEquals("hasAnyRole('SUPERUSER','INTERMEDIATE_USER')", security.value());
        assertFalse(security.value().contains("BASIC_USER"));
    }
}
