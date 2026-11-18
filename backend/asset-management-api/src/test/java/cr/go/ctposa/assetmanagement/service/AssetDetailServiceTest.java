package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.asset.AssetDetailResponse;
import cr.go.ctposa.assetmanagement.exception.AssetNotFoundException;
import cr.go.ctposa.assetmanagement.model.*;
import cr.go.ctposa.assetmanagement.repository.*;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** HU-GA-02: unidad de servicio aislada mediante Mockito. */
@ExtendWith(MockitoExtension.class)
class AssetDetailServiceTest {
    @Mock AssetRepository assets;
    @Mock AssetStatusRepository statuses;
    @Mock LocationRepository locations;
    @Mock CategoryRepository categories;
    @Mock AcquisitionModeRepository modes;
    @Mock UserRepository users;
    @Mock AuditRepository audits;
    @InjectMocks AssetService service;

    private Asset asset;

    @BeforeEach
    void setUp() {
        asset = new Asset();
        ReflectionTestUtils.setField(asset, "id", 5);
        asset.setAssetNumber("ACT-2026-0005");
        asset.setDescription("Computadora portatil");
        asset.setBrand("Dell");
        asset.setModel("Latitude 5440");
        asset.setSerial("SN-005");
        asset.setPrice(new BigDecimal("450000.00"));
        asset.setNotes("Incluye cargador");
        asset.setDecommissioned(false);
        AssetStatus status = new AssetStatus("Bueno", "Funcional");
        Location location = new Location("Laboratorio 1", "Edificio A");
        Category category = new Category("Equipo de computo", "Computadoras");
        AcquisitionMode mode = new AcquisitionMode("Compra", "Compra directa");
        ReflectionTestUtils.setField(status, "id", 1);
        ReflectionTestUtils.setField(location, "id", 2);
        ReflectionTestUtils.setField(category, "id", 3);
        ReflectionTestUtils.setField(mode, "id", 4);
        asset.setStatus(status);
        asset.setLocation(location);
        asset.setCategory(category);
        asset.setAcquisitionMode(mode);
    }

    // CA01: consulta de un activo existente
    @Test
    void getAssetDetail_ExistingId_ReturnsCompleteDtoWithoutWriting() {
        when(assets.findById(5)).thenReturn(Optional.of(asset));

        AssetDetailResponse result = service.getAssetDetail(5);

        assertNotNull(result);
        assertEquals(5, result.id());
        assertEquals("ACT-2026-0005", result.assetNumber());
        assertEquals("Computadora portatil", result.description());
        assertEquals("Dell", result.brand());
        assertEquals("Latitude 5440", result.model());
        assertEquals("SN-005", result.serial());
        assertEquals(new BigDecimal("450000.00"), result.price());
        assertEquals(1, result.statusId());
        assertEquals("Bueno", result.status());
        assertEquals(2, result.locationId());
        assertEquals("Laboratorio 1", result.location());
        assertEquals(3, result.categoryId());
        assertEquals("Equipo de computo", result.category());
        assertEquals(4, result.acquisitionModeId());
        assertEquals("Compra", result.acquisitionMode());
        assertNull(result.currentResponsibleId());
        assertNull(result.currentResponsible());
        assertFalse(result.decommissioned());
        assertEquals("Incluye cargador", result.notes());
        verify(assets, times(1)).findById(5);
        verify(assets, never()).save(any(Asset.class));
        verifyNoInteractions(audits);
    }

    // CA02: activo inexistente -> AssetNotFoundException (HTTP 404 en controlador/advice)
    @Test
    void getAssetDetail_UnknownId_ThrowsNotFoundAndWritesNothing() {
        when(assets.findById(999)).thenReturn(Optional.empty());

        AssetNotFoundException error = assertThrows(AssetNotFoundException.class,
                () -> service.getAssetDetail(999));

        assertEquals("El activo con ID 999 no existe.", error.getMessage());
        verify(assets, times(1)).findById(999);
        verify(assets, never()).save(any(Asset.class));
        verifyNoInteractions(audits);
    }
}
