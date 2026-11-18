package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.asset.AssetDetailResponse;
import cr.go.ctposa.assetmanagement.exception.AssetNotFoundException;
import cr.go.ctposa.assetmanagement.exception.GlobalExceptionHandler;
import cr.go.ctposa.assetmanagement.service.AssetService;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AssetDetailControllerTest {
    @Test
    void getAssetDetail_ExistingId_ReturnsHttp200WithDto() {
        AssetService service = mock(AssetService.class);
        AssetDetailResponse expected = new AssetDetailResponse(5, "ACT-005", "Equipo", "Dell",
                null, null, new BigDecimal("450000.00"), 1, "Bueno", 2, "Aula 1",
                3, "Equipo de computo", 4, "Compra", null, null, false, null);
        when(service.getAssetDetail(5)).thenReturn(expected);

        ResponseEntity<AssetDetailResponse> response = new AssetController(service).getAssetDetail(5);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(expected, response.getBody());
        verify(service, times(1)).getAssetDetail(5);
    }

    @Test
    void getAssetDetail_EndpointUsesGetAndRequiresReadPermission() throws Exception {
        Method method = AssetController.class.getMethod("getAssetDetail", Integer.class);
        assertEquals("/{id}", method.getAnnotation(GetMapping.class).value()[0]);
        assertEquals("hasRole('SUPERUSER') or hasAuthority('ASSET_READ')",
                method.getAnnotation(PreAuthorize.class).value());
    }

    @Test
    void notFoundException_MapsToHttp404() {
        ResponseEntity<java.util.Map<String, Object>> response =
                new GlobalExceptionHandler().handleAssetNotFound(new AssetNotFoundException(999));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals(404, response.getBody().get("status"));
        assertEquals("Not Found", response.getBody().get("error"));
    }
}
