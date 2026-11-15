package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.catalog.CatalogDeleteResponse;
import cr.go.ctposa.assetmanagement.dto.catalog.CatalogEntryRequest;
import cr.go.ctposa.assetmanagement.dto.catalog.CatalogEntryResponse;
import cr.go.ctposa.assetmanagement.model.CatalogType;
import cr.go.ctposa.assetmanagement.service.CatalogService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Administracion de catalogos. El usuario basico no tiene acceso. */
@RestController
@RequestMapping("/api/v1/catalogs")
@PreAuthorize("hasAnyRole('SUPERUSER','INTERMEDIATE_USER')")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/{type}")
    public ResponseEntity<List<CatalogEntryResponse>> list(@PathVariable String type) {
        return ResponseEntity.ok(catalogService.list(CatalogType.fromSlug(type)));
    }

    @PostMapping("/{type}")
    public ResponseEntity<CatalogEntryResponse> create(
            @PathVariable String type, @Valid @RequestBody CatalogEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogService.create(CatalogType.fromSlug(type), request));
    }

    @PutMapping("/{type}/{id}")
    public ResponseEntity<CatalogEntryResponse> update(
            @PathVariable String type, @PathVariable Integer id,
            @Valid @RequestBody CatalogEntryRequest request) {
        return ResponseEntity.ok(catalogService.update(CatalogType.fromSlug(type), id, request));
    }

    @DeleteMapping("/{type}/{id}")
    public ResponseEntity<CatalogDeleteResponse> delete(
            @PathVariable String type, @PathVariable Integer id) {
        return ResponseEntity.ok(catalogService.delete(CatalogType.fromSlug(type), id));
    }
}
