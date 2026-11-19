package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.asset.AssetDetailResponse;
import cr.go.ctposa.assetmanagement.dto.asset.UpdateAssetRequest;
import cr.go.ctposa.assetmanagement.service.AssetService;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import java.lang.annotation.Annotation;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UpdateAssetControllerTest {
    @Test
    void updateAsset_UsesPutAndIsRestrictedToSuperuser() throws Exception {
        Method method = AssetController.class.getMethod("updateAsset", Integer.class, UpdateAssetRequest.class);
        assertEquals("/{id}", method.getAnnotation(PutMapping.class).value()[0]);
        assertEquals("hasRole('SUPERUSER')", method.getAnnotation(PreAuthorize.class).value());
        assertNotNull(method.getParameters()[1].getAnnotation(Valid.class));
        assertNotNull(method.getParameters()[1].getAnnotation(RequestBody.class));
    }
    @Test
    void updateAsset_ReturnsServiceResultWith200() {
        AssetService service = mock(AssetService.class);
        UpdateAssetRequest input = new UpdateAssetRequest();
        when(service.updateAsset(eq(5), same(input))).thenReturn(mock(AssetDetailResponse.class));
        ResponseEntity<AssetDetailResponse> result = new AssetController(service).updateAsset(5, input);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(service).updateAsset(5, input);
    }
}
