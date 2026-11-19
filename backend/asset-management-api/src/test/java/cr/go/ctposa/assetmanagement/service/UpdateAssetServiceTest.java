package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.asset.AssetDetailResponse;
import cr.go.ctposa.assetmanagement.dto.asset.UpdateAssetRequest;
import cr.go.ctposa.assetmanagement.exception.AssetNotFoundException;
import cr.go.ctposa.assetmanagement.model.*;
import cr.go.ctposa.assetmanagement.repository.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateAssetServiceTest {
    @Mock AssetRepository assets;
    @Mock AssetStatusRepository statuses;
    @Mock LocationRepository locations;
    @Mock CategoryRepository categories;
    @Mock AcquisitionModeRepository modes;
    @Mock UserRepository users;
    @Mock AuditRepository audits;
    @InjectMocks AssetService service;
    UpdateAssetRequest request;
    Asset asset;
    AssetStatus status;
    Location location;
    Category category;
    AcquisitionMode mode;
    User actor;

    @BeforeEach
    void setUp() {
        status = new AssetStatus("Bueno", "Funcional");
        location = new Location("Laboratorio", "Edificio A");
        category = new Category("Computo", "Equipo de computo");
        mode = new AcquisitionMode("Compra", "Compra directa");
        ReflectionTestUtils.setField(status, "id", 1);
        ReflectionTestUtils.setField(location, "id", 2);
        ReflectionTestUtils.setField(category, "id", 3);
        ReflectionTestUtils.setField(mode, "id", 4);
        asset = new Asset();
        ReflectionTestUtils.setField(asset, "id", 5);
        asset.setAssetNumber("ACT-005");
        asset.setDescription("Computadora antigua");
        asset.setBrand("Dell");
        asset.setPrice(new BigDecimal("100000.00"));
        asset.setStatus(status);
        asset.setLocation(location);
        asset.setCategory(category);
        asset.setAcquisitionMode(mode);
        asset.setDecommissioned(false);

        request = new UpdateAssetRequest();
        request.setAssetNumber("ACT-005");
        request.setDescription("Computadora actualizada");
        request.setBrand("HP");
        request.setPrice(new BigDecimal("125000.00"));
        request.setStatusId(1);
        request.setLocationId(2);
        request.setCategoryId(3);
        request.setAcquisitionModeId(4);
        actor = new User();
        actor.setEmail("admin@ctposa.ac.cr");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void stubExisting() {
        when(assets.findById(5)).thenReturn(Optional.of(asset));
        when(statuses.findById(1)).thenReturn(Optional.of(status));
        when(locations.findById(2)).thenReturn(Optional.of(location));
        when(categories.findById(3)).thenReturn(Optional.of(category));
        when(modes.findById(4)).thenReturn(Optional.of(mode));
    }
    private void stubActor() {
        when(users.findByEmail("admin@ctposa.ac.cr")).thenReturn(Optional.of(actor));
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("admin@ctposa.ac.cr", null,
                List.of(new SimpleGrantedAuthority("ROLE_SUPERUSER"))));
    }

    // HU-GA-03 CA01: realiza actualizacion y genera trazabilidad.
    @Test
    void updateAsset_ValidData_ChangesAssetAndSavesAudit() {
        stubExisting();
        stubActor();
        when(assets.save(any(Asset.class))).thenAnswer(inv -> inv.getArgument(0));

        AssetDetailResponse result = service.updateAsset(5, request);

        assertEquals(5, result.id());
        assertEquals("Computadora actualizada", result.description());
        assertEquals("HP", result.brand());
        assertEquals(new BigDecimal("125000.00"), result.price());
        assertFalse(result.decommissioned());
        verify(assets).save(asset);
        ArgumentCaptor<Audit> captor = ArgumentCaptor.forClass(Audit.class);
        verify(audits).save(captor.capture());
        assertEquals("UPDATE_ASSET", captor.getValue().getAction());
        assertSame(actor, captor.getValue().getUser());
        assertEquals("bien", captor.getValue().getAffectedTable());
        assertTrue(captor.getValue().getDetails().startsWith("id_activo=5;"));
        assertTrue(captor.getValue().getDetails().contains("descripcion [Computadora antigua -> Computadora actualizada]"));
    }

    // Un ID inexistente no guarda datos ni auditorias.
    @Test
    void updateAsset_UnknownId_DoesNotSave() {
        when(assets.findById(999)).thenReturn(Optional.empty());
        assertThrows(AssetNotFoundException.class, () -> service.updateAsset(999, request));
        verify(assets, never()).save(any());
        verifyNoInteractions(audits);
    }

    // La identificacion de otro activo debe seguir siendo unica.
    @Test
    void updateAsset_DuplicateNumber_DoesNotSave() {
        request.setAssetNumber("OTRO-001");
        when(assets.findById(5)).thenReturn(Optional.of(asset));
        when(assets.existsByAssetNumber("OTRO-001")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> service.updateAsset(5, request));
        verify(assets, never()).save(any());
        verifyNoInteractions(audits);
    }

    @Test
    void updateAsset_NoAuthenticatedActor_RejectsAndDoesNotSave() {
        stubExisting();
        assertThrows(IllegalStateException.class, () -> service.updateAsset(5, request));
        verify(assets, never()).save(any());
        verifyNoInteractions(audits);
    }

    @Test
    void updateAsset_UnchangedData_DoesNotWriteAudit() {
        request.setDescription("Computadora antigua");
        request.setBrand("Dell");
        request.setPrice(new BigDecimal("100000.00"));
        stubExisting();
        stubActor();
        AssetDetailResponse response = service.updateAsset(5, request);
        assertEquals("Computadora antigua", response.description());
        verify(assets, never()).save(any());
        verifyNoInteractions(audits);
    }
}
