package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.catalog.CatalogDeleteResponse;
import cr.go.ctposa.assetmanagement.dto.catalog.CatalogEntryRequest;
import cr.go.ctposa.assetmanagement.dto.catalog.CatalogEntryResponse;
import cr.go.ctposa.assetmanagement.exception.CatalogItemInUseException;
import cr.go.ctposa.assetmanagement.model.AssetStatus;
import cr.go.ctposa.assetmanagement.model.Audit;
import cr.go.ctposa.assetmanagement.model.CatalogType;
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
class CatalogServiceTest {
    @Mock AssetStatusRepository statuses;
    @Mock LocationRepository locations;
    @Mock CategoryRepository categories;
    @Mock AcquisitionModeRepository modes;
    @Mock AssetRepository assets;
    @Mock AuditRepository audits;
    @Mock UserRepository users;
    @InjectMocks CatalogService service;

    User actor;

    @BeforeEach
    void setup() {
        actor = new User();
        ReflectionTestUtils.setField(actor, "id", 1);
        actor.setEmail("marta@ctposa.ac.cr");
    }

    @AfterEach
    void cleanup() { SecurityContextHolder.clearContext(); }

    private void authenticateActor() {
        when(users.findByEmail("marta@ctposa.ac.cr")).thenReturn(Optional.of(actor));
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("marta@ctposa.ac.cr", null,
                List.of(new SimpleGrantedAuthority("ROLE_INTERMEDIATE_USER"))));
    }

    private Location location(int id, String name, String building) {
        Location location = new Location(name, building);
        ReflectionTestUtils.setField(location, "id", id);
        return location;
    }

    // CA01: la lista incluye cuantos activos usan cada elemento
    @Test
    void list_ReturnsEntriesWithUsageAndDeletableFlag() {
        when(locations.findAllByOrderByNameAsc()).thenReturn(List.of(
            location(1, "Aula 1", "Edificio A"), location(2, "Aula 2", "Edificio A")));
        when(assets.countByLocation_Id(1)).thenReturn(3L);
        when(assets.countByLocation_Id(2)).thenReturn(0L);

        List<CatalogEntryResponse> result = service.list(CatalogType.LOCATION);

        assertEquals(2, result.size());
        assertEquals(3L, result.get(0).usageCount());
        assertFalse(result.get(0).deletable());
        assertTrue(result.get(1).deletable());
        assertEquals("Edificio A", result.get(0).detail());
    }

    // CA02: crear un elemento valido, con auditoria
    @Test
    void create_ValidLocation_SavesTrimmedValuesAndAudits() {
        authenticateActor();
        when(locations.existsByNameIgnoreCase("Aula 9")).thenReturn(false);
        when(locations.save(any(Location.class))).thenAnswer(call -> {
            Location saved = call.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 9);
            return saved;
        });

        CatalogEntryResponse result = service.create(CatalogType.LOCATION,
            new CatalogEntryRequest("  Aula 9 ", " Edificio B "));

        assertEquals(9, result.id());
        assertEquals("Aula 9", result.name());
        assertEquals("Edificio B", result.detail());
        assertEquals(0L, result.usageCount());
        ArgumentCaptor<Audit> captor = ArgumentCaptor.forClass(Audit.class);
        verify(audits).save(captor.capture());
        assertEquals("CREATE_CATALOG", captor.getValue().getAction());
        assertEquals("ubicacion", captor.getValue().getAffectedTable());
        assertSame(actor, captor.getValue().getUser());
    }

    @Test
    void create_StatusWithoutDescription_StoresNullDetail() {
        authenticateActor();
        when(statuses.save(any(AssetStatus.class))).thenAnswer(call -> call.getArgument(0));

        CatalogEntryResponse result = service.create(CatalogType.STATUS, new CatalogEntryRequest("Roto", "  "));

        assertNull(result.detail());
    }

    // CA03: datos invalidos o repetidos no se guardan
    @Test
    void create_DuplicateName_ThrowsAndDoesNotSave() {
        when(locations.existsByNameIgnoreCase("Aula 1")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () ->
            service.create(CatalogType.LOCATION, new CatalogEntryRequest("Aula 1", "Edificio A")));

        verify(locations, never()).save(any());
        verifyNoInteractions(audits);
    }

    @Test
    void create_LocationWithoutBuilding_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
            service.create(CatalogType.LOCATION, new CatalogEntryRequest("Aula 1", " ")));
        verify(locations, never()).save(any());
    }

    @Test
    void create_BlankOrTooLongName_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
            service.create(CatalogType.CATEGORY, new CatalogEntryRequest("   ", null)));
        assertThrows(IllegalArgumentException.class, () ->
            service.create(CatalogType.STATUS, new CatalogEntryRequest("x".repeat(51), null)));
    }

    // CA04: eliminar un elemento sin registros asociados
    @Test
    void delete_UnusedElement_DeletesAndAudits() {
        authenticateActor();
        Location aula = location(2, "Aula 2", "Edificio A");
        when(locations.findById(2)).thenReturn(Optional.of(aula));
        when(assets.countByLocation_Id(2)).thenReturn(0L);

        CatalogDeleteResponse result = service.delete(CatalogType.LOCATION, 2);

        assertNotNull(result.message());
        verify(locations).delete(aula);
        ArgumentCaptor<Audit> captor = ArgumentCaptor.forClass(Audit.class);
        verify(audits).save(captor.capture());
        assertEquals("DELETE_CATALOG", captor.getValue().getAction());
    }

    // CA05: un elemento con registros asociados no se elimina
    @Test
    void delete_ElementInUse_ThrowsConflictAndKeepsIt() {
        Category equipo = new Category("Equipo de computo", null);
        ReflectionTestUtils.setField(equipo, "id", 3);
        when(categories.findById(3)).thenReturn(Optional.of(equipo));
        when(assets.countByCategory_Id(3)).thenReturn(4L);

        CatalogItemInUseException error = assertThrows(CatalogItemInUseException.class,
            () -> service.delete(CatalogType.CATEGORY, 3));

        assertTrue(error.getMessage().contains("4"));
        verify(categories, never()).delete(any());
        verifyNoInteractions(audits);
    }

    // CA05: red de seguridad cuando otra tabla (historial, verificacion) usa la ubicacion
    @Test
    void delete_ForeignKeyViolation_ThrowsConflict() {
        authenticateActor();
        Location aula = location(2, "Aula 2", "Edificio A");
        when(locations.findById(2)).thenReturn(Optional.of(aula));
        when(assets.countByLocation_Id(2)).thenReturn(0L);
        doThrow(new DataIntegrityViolationException("fk")).when(locations).flush();

        assertThrows(CatalogItemInUseException.class, () -> service.delete(CatalogType.LOCATION, 2));
        verifyNoInteractions(audits);
    }

    @Test
    void delete_UnknownId_Throws() {
        when(locations.findById(99)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.delete(CatalogType.LOCATION, 99));
    }

    // CA06: sin usuario autenticado no se modifica nada
    @Test
    void create_WithoutAuthenticatedUser_ThrowsAndDoesNotSave() {
        assertThrows(IllegalStateException.class, () ->
            service.create(CatalogType.CATEGORY, new CatalogEntryRequest("Libros", null)));
        verify(categories, never()).save(any());
    }

    // CA07: editar un elemento
    @Test
    void update_ChangesNameAndDetailAndAudits() {
        authenticateActor();
        Location aula = location(2, "Aula 2", "Edificio A");
        when(locations.findById(2)).thenReturn(Optional.of(aula));
        when(locations.existsByNameIgnoreCaseAndIdNot("Aula 2B", 2)).thenReturn(false);

        CatalogEntryResponse result = service.update(CatalogType.LOCATION, 2,
            new CatalogEntryRequest("Aula 2B", "Edificio C"));

        assertEquals("Aula 2B", aula.getName());
        assertEquals("Edificio C", aula.getBuilding());
        assertEquals("Aula 2B", result.name());
        verify(locations).save(aula);
        verify(audits).save(any(Audit.class));
    }

    @Test
    void update_NameUsedByAnotherElement_Throws() {
        Location aula = location(2, "Aula 2", "Edificio A");
        when(locations.findById(2)).thenReturn(Optional.of(aula));
        when(locations.existsByNameIgnoreCaseAndIdNot("Aula 1", 2)).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () ->
            service.update(CatalogType.LOCATION, 2, new CatalogEntryRequest("Aula 1", "Edificio A")));
        verify(locations, never()).save(any());
    }
}
