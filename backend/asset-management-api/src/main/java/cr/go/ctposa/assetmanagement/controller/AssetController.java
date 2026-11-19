package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.asset.AssetAuditResponse;
import cr.go.ctposa.assetmanagement.dto.asset.AssetCatalogResponse;
import cr.go.ctposa.assetmanagement.dto.asset.AssetDetailResponse;
import cr.go.ctposa.assetmanagement.dto.asset.AssetResponse;
import cr.go.ctposa.assetmanagement.dto.asset.CreateAssetRequest;
import cr.go.ctposa.assetmanagement.dto.asset.UpdateAssetRequest;
import cr.go.ctposa.assetmanagement.service.AssetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/assets")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    /** HU-GA-01: registrar un activo. 201 si se crea y 400 si los datos fallan. */
    @PostMapping
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<AssetResponse> createAsset(
            @Valid @RequestBody CreateAssetRequest request) {

        AssetResponse response = assetService.createAsset(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /** Lista de activos registrados. */
    @GetMapping
    @PreAuthorize("hasRole('SUPERUSER') or hasAuthority('ASSET_READ')")
    public ResponseEntity<List<AssetResponse>> listAssets() {
        return ResponseEntity.ok(assetService.listAssets());
    }

    /** HU-GA-02: obtener el detalle de un activo existente, 404 cuando no exista. */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPERUSER') or hasAuthority('ASSET_READ')")
    public ResponseEntity<AssetDetailResponse> getAssetDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(assetService.getAssetDetail(id));
    }

    /** HU-GA-03: solo el SUPERUSER puede actualizar un activo existente. */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<AssetDetailResponse> updateAsset(
            @PathVariable Integer id, @Valid @RequestBody UpdateAssetRequest request) {
        return ResponseEntity.ok(assetService.updateAsset(id, request));
    }

    /** Opciones para las listas desplegables del formulario de registro. */
    @GetMapping("/catalog")
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<AssetCatalogResponse> getCatalog() {
        return ResponseEntity.ok(assetService.getCatalog());
    }

    /** Trazabilidad de un activo: quien, cuando y que accion. */
    @GetMapping("/{id}/audit")
    @PreAuthorize("hasRole('SUPERUSER')")
    public ResponseEntity<List<AssetAuditResponse>> getAssetAudit(@PathVariable Integer id) {
        return ResponseEntity.ok(assetService.getAssetAudit(id));
    }
}
