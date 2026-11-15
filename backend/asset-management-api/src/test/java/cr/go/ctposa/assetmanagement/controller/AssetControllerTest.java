package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.asset.AssetResponse;
import cr.go.ctposa.assetmanagement.dto.asset.CreateAssetRequest;
import cr.go.ctposa.assetmanagement.exception.GlobalExceptionHandler;
import cr.go.ctposa.assetmanagement.service.AssetService;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AssetControllerTest {

    // CA01: el endpoint responde 201 con el activo creado
    @Test
    void createAsset_ValidRequest_ReturnsHttp201() {
        AssetService service = mock(AssetService.class);
        CreateAssetRequest request = new CreateAssetRequest();
        AssetResponse expected = new AssetResponse(5, "ACT-2026-0001", "Computadora portatil",
                "Dell", null, null, new BigDecimal("125000.50"), "Bueno", "Laboratorio 1",
                "Equipo de computo", "Compra", null, false, null);
        when(service.createAsset(request)).thenReturn(expected);

        ResponseEntity<AssetResponse> result = new AssetController(service).createAsset(request);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertSame(expected, result.getBody());
        verify(service, times(1)).createAsset(request);
    }

    // El endpoint esta protegido: solo el superusuario lo puede usar
    @Test
    void createAsset_EndpointIsPostAndRequiresSuperuserRole() throws Exception {
        Method method = AssetController.class.getMethod("createAsset", CreateAssetRequest.class);

        assertNotNull(method.getAnnotation(PostMapping.class));
        PreAuthorize security = method.getAnnotation(PreAuthorize.class);
        assertNotNull(security);
        assertEquals("hasRole('SUPERUSER')", security.value());
    }

    @Test
    void catalogAndAuditEndpoints_RequireSuperuserRole() throws Exception {
        Method catalog = AssetController.class.getMethod("getCatalog");
        Method audit = AssetController.class.getMethod("getAssetAudit", Integer.class);

        assertEquals("hasRole('SUPERUSER')", catalog.getAnnotation(PreAuthorize.class).value());
        assertEquals("hasRole('SUPERUSER')", audit.getAnnotation(PreAuthorize.class).value());
    }

    // CA01: la lista de activos permite comprobar el registro
    @Test
    void listAssets_ReturnsHttp200WithTheList() {
        AssetService service = mock(AssetService.class);
        List<AssetResponse> expected = List.of();
        when(service.listAssets()).thenReturn(expected);

        ResponseEntity<List<AssetResponse>> result = new AssetController(service).listAssets();

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertSame(expected, result.getBody());
    }

    // CA04: el rechazo por activo duplicado se convierte en 400 con su mensaje
    @Test
    void duplicateAsset_IsReportedAsHttp400WithMessage() {
        String message = "Ya existe un activo con ese numero de identificacion";

        ResponseEntity<Map<String, Object>> result = new GlobalExceptionHandler()
                .handleIllegalArgument(new IllegalArgumentException(message));

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertEquals(message, result.getBody().get("message"));
    }
}
