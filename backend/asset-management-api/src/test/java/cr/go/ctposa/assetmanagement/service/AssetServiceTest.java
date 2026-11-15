package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.asset.AssetAuditResponse;
import cr.go.ctposa.assetmanagement.dto.asset.AssetCatalogResponse;
import cr.go.ctposa.assetmanagement.dto.asset.AssetResponse;
import cr.go.ctposa.assetmanagement.dto.asset.CreateAssetRequest;
import cr.go.ctposa.assetmanagement.model.AcquisitionMode;
import cr.go.ctposa.assetmanagement.model.Asset;
import cr.go.ctposa.assetmanagement.model.AssetStatus;
import cr.go.ctposa.assetmanagement.model.Audit;
import cr.go.ctposa.assetmanagement.model.Category;
import cr.go.ctposa.assetmanagement.model.Location;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.AcquisitionModeRepository;
import cr.go.ctposa.assetmanagement.repository.AssetRepository;
import cr.go.ctposa.assetmanagement.repository.AssetStatusRepository;
import cr.go.ctposa.assetmanagement.repository.AuditRepository;
import cr.go.ctposa.assetmanagement.repository.CategoryRepository;
import cr.go.ctposa.assetmanagement.repository.LocationRepository;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {
    @Mock AssetRepository assets;
    @Mock AssetStatusRepository statuses;
    @Mock LocationRepository locations;
    @Mock CategoryRepository categories;
    @Mock AcquisitionModeRepository modes;
    @Mock UserRepository users;
    @Mock AuditRepository audits;
    @InjectMocks AssetService service;

    CreateAssetRequest input;
    AssetStatus status;
    Location location;
    Category category;
    AcquisitionMode mode;
    User actor;

    @BeforeEach
    void setup() {
        input = new CreateAssetRequest();
        input.setAssetNumber(" ACT-2026-0001 ");
        input.setDescription(" Computadora portatil ");
        input.setBrand("Dell");
        input.setModel("   ");
        input.setPrice(new BigDecimal("125000.50"));
        input.setStatusId(1);
        input.setLocationId(2);
        input.setCategoryId(3);
        input.setAcquisitionModeId(4);

        status = new AssetStatus("Bueno", "Funcional");
        location = new Location("Laboratorio 1", "Edificio A");
        category = new Category("Equipo de computo", "Computadoras");
        mode = new AcquisitionMode("Compra", "Compra directa");

        actor = new User();
        ReflectionTestUtils.setField(actor, "id", 1);
        actor.setEmail("admin@ctposa.ac.cr");
    }

    @AfterEach
    void cleanup() { SecurityContextHolder.clearContext(); }

    private void stubCatalogs() {
        when(statuses.findById(1)).thenReturn(Optional.of(status));
        when(locations.findById(2)).thenReturn(Optional.of(location));
        when(categories.findById(3)).thenReturn(Optional.of(category));
        when(modes.findById(4)).thenReturn(Optional.of(mode));
    }

    private void authenticateActor() {
        when(users.findByEmail("admin@ctposa.ac.cr")).thenReturn(Optional.of(actor));
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("admin@ctposa.ac.cr", null,
                List.of(new SimpleGrantedAuthority("ROLE_SUPERUSER"))));
    }

    private void stubSaveWithId(int id) {
        when(assets.save(any(Asset.class))).thenAnswer(call -> {
            Asset saved = call.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", id);
            return saved;
        });
    }

    // CA01: registro exitoso con trazabilidad
    @Test
    void createAsset_ValidRequest_SavesAssetAndWritesAudit() {
        stubCatalogs();
        authenticateActor();
        stubSaveWithId(5);

        AssetResponse result = service.createAsset(input);

        assertEquals(5, result.id());
        assertEquals("ACT-2026-0001", result.assetNumber());
        assertEquals("Computadora portatil", result.description());
        assertEquals("Bueno", result.status());
        assertEquals("Laboratorio 1", result.location());
        assertEquals("Equipo de computo", result.category());
        assertEquals("Compra", result.acquisitionMode());
        assertEquals(new BigDecimal("125000.50"), result.price());
        assertNull(result.currentResponsible());
        assertFalse(result.decommissioned());

        ArgumentCaptor<Asset> asset = ArgumentCaptor.forClass(Asset.class);
        verify(assets, times(1)).save(asset.capture());
        assertEquals("Dell", asset.getValue().getBrand());
        assertNull(asset.getValue().getModel());
        assertFalse(asset.getValue().getDecommissioned());

        ArgumentCaptor<Audit> audit = ArgumentCaptor.forClass(Audit.class);
        verify(audits, times(1)).save(audit.capture());
        assertEquals("CREATE_ASSET", audit.getValue().getAction());
        assertEquals("bien", audit.getValue().getAffectedTable());
        assertSame(actor, audit.getValue().getUser());
        assertTrue(audit.getValue().getDetails().startsWith("id_activo=5;"));
        assertTrue(audit.getValue().getDetails().contains("numero_id=ACT-2026-0001"));
    }

    // CA01: el responsable es opcional, pero si se indica debe estar activo
    @Test
    void createAsset_WithActiveResponsible_AssignsResponsible() {
        input.setCurrentResponsibleId(7);
        User responsible = new User();
        responsible.setName("Ana Perez");
        responsible.setActive(true);
        when(users.findById(7)).thenReturn(Optional.of(responsible));
        stubCatalogs();
        authenticateActor();
        stubSaveWithId(6);

        AssetResponse result = service.createAsset(input);

        assertEquals("Ana Perez", result.currentResponsible());
    }

    @Test
    void createAsset_WithInactiveResponsible_ThrowsAndSavesNothing() {
        input.setCurrentResponsibleId(7);
        User responsible = new User();
        responsible.setActive(false);
        when(users.findById(7)).thenReturn(Optional.of(responsible));
        stubCatalogs();

        var error = assertThrows(IllegalArgumentException.class, () -> service.createAsset(input));

        assertEquals("El responsable indicado esta inactivo", error.getMessage());
        verify(assets, never()).save(any(Asset.class));
        verifyNoInteractions(audits);
    }

    // CA02: un dato obligatorio de catalogo que no existe se rechaza sin guardar
    @Test
    void createAsset_StatusDoesNotExist_ThrowsAndSavesNothing() {
        when(statuses.findById(1)).thenReturn(Optional.empty());

        var error = assertThrows(IllegalArgumentException.class, () -> service.createAsset(input));

        assertEquals("El estado indicado no existe", error.getMessage());
        verify(assets, never()).save(any(Asset.class));
        verifyNoInteractions(audits);
    }

    // CA04: el activo ya existe
    @Test
    void createAsset_DuplicateAssetNumber_ThrowsAndSavesNothing() {
        when(assets.existsByAssetNumber("ACT-2026-0001")).thenReturn(true);

        var error = assertThrows(IllegalArgumentException.class, () -> service.createAsset(input));

        assertEquals("Ya existe un activo con ese numero de identificacion", error.getMessage());
        verify(assets, never()).save(any(Asset.class));
        verifyNoInteractions(audits);
        verifyNoInteractions(statuses, locations, categories, modes);
    }

    // CA04: dos registros simultaneos con el mismo numero, la base de datos rechaza el segundo
    @Test
    void createAsset_ConstraintViolationOnSave_ThrowsIllegalArgumentAndNoAudit() {
        stubCatalogs();
        authenticateActor();
        when(assets.save(any(Asset.class))).thenThrow(new DataIntegrityViolationException("duplicado"));

        var error = assertThrows(IllegalArgumentException.class, () -> service.createAsset(input));

        assertTrue(error.getMessage().contains("ya existe"));
        verifyNoInteractions(audits);
    }

    // Sin usuario autenticado no se puede registrar la trazabilidad, por lo tanto no se guarda nada
    @Test
    void createAsset_WithoutAuthenticatedUser_SavesNothing() {
        stubCatalogs();

        assertThrows(IllegalStateException.class, () -> service.createAsset(input));

        verify(assets, never()).save(any(Asset.class));
        verifyNoInteractions(audits);
    }

    // CA01: el activo registrado aparece en la lista
    @Test
    void listAssets_ReturnsRegisteredAssets() {
        Asset asset = new Asset();
        ReflectionTestUtils.setField(asset, "id", 5);
        asset.setAssetNumber("ACT-2026-0001");
        asset.setDescription("Computadora portatil");
        asset.setStatus(status);
        asset.setLocation(location);
        asset.setCategory(category);
        asset.setAcquisitionMode(mode);
        when(assets.findAllByOrderByIdDesc()).thenReturn(List.of(asset));

        List<AssetResponse> result = service.listAssets();

        assertEquals(1, result.size());
        assertEquals("ACT-2026-0001", result.get(0).assetNumber());
        assertEquals("Bueno", result.get(0).status());
    }

    // Las listas desplegables del formulario salen de la base de datos
    @Test
    void getCatalog_MapsNamesForEachList() {
        ReflectionTestUtils.setField(status, "id", 1);
        ReflectionTestUtils.setField(location, "id", 2);
        User responsible = new User();
        ReflectionTestUtils.setField(responsible, "id", 7);
        responsible.setName("Ana Perez");
        responsible.setEmail("ana@ctposa.ac.cr");
        when(statuses.findAll()).thenReturn(List.of(status));
        when(locations.findAll()).thenReturn(List.of(location));
        when(categories.findAll()).thenReturn(List.of(category));
        when(modes.findAll()).thenReturn(List.of(mode));
        when(users.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(responsible));

        AssetCatalogResponse result = service.getCatalog();

        assertEquals("Bueno", result.statuses().get(0).name());
        assertEquals("Laboratorio 1 - Edificio A", result.locations().get(0).name());
        assertEquals("Equipo de computo", result.categories().get(0).name());
        assertEquals("Compra", result.acquisitionModes().get(0).name());
        assertEquals("Ana Perez (ana@ctposa.ac.cr)", result.responsibles().get(0).name());
    }

    // La trazabilidad puede ser consultada: quien, cuando y que activo
    @Test
    void getAssetAudit_ReturnsWhoWhenAndWhat() {
        Audit audit = new Audit();
        ReflectionTestUtils.setField(audit, "id", 10);
        ReflectionTestUtils.setField(audit, "dateTime", LocalDateTime.of(2026, 11, 14, 10, 30));
        audit.setUser(actor);
        audit.setAction("CREATE_ASSET");
        audit.setDetails("id_activo=5; Activo creado: numero_id=ACT-2026-0001");
        when(assets.existsById(5)).thenReturn(true);
        when(audits.findByAffectedTableAndDetailsStartingWithOrderByIdAsc("bien", "id_activo=5;"))
            .thenReturn(List.of(audit));

        List<AssetAuditResponse> result = service.getAssetAudit(5);

        assertEquals(1, result.size());
        assertEquals("CREATE_ASSET", result.get(0).action());
        assertEquals("admin@ctposa.ac.cr", result.get(0).user());
        assertEquals(LocalDateTime.of(2026, 11, 14, 10, 30), result.get(0).dateTime());
    }

    @Test
    void getAssetAudit_AssetDoesNotExist_Throws() {
        when(assets.existsById(99)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> service.getAssetAudit(99));

        verifyNoInteractions(audits);
    }
}
