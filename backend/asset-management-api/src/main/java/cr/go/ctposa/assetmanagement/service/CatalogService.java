package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.catalog.CatalogDeleteResponse;
import cr.go.ctposa.assetmanagement.dto.catalog.CatalogEntryRequest;
import cr.go.ctposa.assetmanagement.dto.catalog.CatalogEntryResponse;
import cr.go.ctposa.assetmanagement.exception.CatalogItemInUseException;
import cr.go.ctposa.assetmanagement.model.AcquisitionMode;
import cr.go.ctposa.assetmanagement.model.AssetStatus;
import cr.go.ctposa.assetmanagement.model.Audit;
import cr.go.ctposa.assetmanagement.model.CatalogEntity;
import cr.go.ctposa.assetmanagement.model.CatalogType;
import cr.go.ctposa.assetmanagement.model.Category;
import cr.go.ctposa.assetmanagement.model.Location;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.AcquisitionModeRepository;
import cr.go.ctposa.assetmanagement.repository.AssetRepository;
import cr.go.ctposa.assetmanagement.repository.AssetStatusRepository;
import cr.go.ctposa.assetmanagement.repository.AuditRepository;
import cr.go.ctposa.assetmanagement.repository.CatalogRepository;
import cr.go.ctposa.assetmanagement.repository.CategoryRepository;
import cr.go.ctposa.assetmanagement.repository.LocationRepository;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Administracion de los catalogos: listar, crear, editar y eliminar solo si no estan en uso. */
@Service
public class CatalogService {

    private final AssetStatusRepository statusRepository;
    private final LocationRepository locationRepository;
    private final CategoryRepository categoryRepository;
    private final AcquisitionModeRepository acquisitionModeRepository;
    private final AssetRepository assetRepository;
    private final AuditRepository auditRepository;
    private final UserRepository userRepository;

    public CatalogService(
            AssetStatusRepository statusRepository,
            LocationRepository locationRepository,
            CategoryRepository categoryRepository,
            AcquisitionModeRepository acquisitionModeRepository,
            AssetRepository assetRepository,
            AuditRepository auditRepository,
            UserRepository userRepository) {
        this.statusRepository = statusRepository;
        this.locationRepository = locationRepository;
        this.categoryRepository = categoryRepository;
        this.acquisitionModeRepository = acquisitionModeRepository;
        this.assetRepository = assetRepository;
        this.auditRepository = auditRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CatalogEntryResponse> list(CatalogType type) {
        return repositoryOf(type).findAllByOrderByNameAsc().stream()
                .map(entity -> toResponse(type, entity))
                .toList();
    }

    @Transactional
    public CatalogEntryResponse create(CatalogType type, CatalogEntryRequest request) {
        String name = cleanName(type, request);
        String detail = cleanDetail(type, request);
        CatalogRepository<? extends CatalogEntity> repository = repositoryOf(type);

        if (repository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Ya existe un elemento con el nombre: " + name);
        }
        User actor = currentActor();

        CatalogEntity saved = saveNew(type, name, detail);
        writeAudit(actor, "CREATE_CATALOG", type,
                "Se creo '" + name + "' (id " + saved.getId() + ")");
        return toResponse(type, saved);
    }

    @Transactional
    public CatalogEntryResponse update(CatalogType type, Integer id, CatalogEntryRequest request) {
        String name = cleanName(type, request);
        String detail = cleanDetail(type, request);
        CatalogRepository<? extends CatalogEntity> repository = repositoryOf(type);

        CatalogEntity entity = find(type, id);
        if (repository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new IllegalArgumentException("Ya existe un elemento con el nombre: " + name);
        }
        User actor = currentActor();

        String oldName = entity.getName();
        entity.setName(name);
        entity.setDetail(detail);
        saveAny(type, entity);
        writeAudit(actor, "UPDATE_CATALOG", type,
                "Se modifico id " + id + ": '" + oldName + "' a '" + name + "'");
        return toResponse(type, entity);
    }

    @Transactional
    public CatalogDeleteResponse delete(CatalogType type, Integer id) {
        CatalogEntity entity = find(type, id);
        long usage = usageOf(type, id);
        if (usage > 0) {
            throw new CatalogItemInUseException(
                    "No se puede eliminar '" + entity.getName() + "' porque tiene "
                            + usage + " registro(s) asociado(s)");
        }
        User actor = currentActor();

        try {
            deleteAny(type, entity);
        } catch (DataIntegrityViolationException exception) {
            // Red de seguridad: otras tablas (historial, verificacion) tambien referencian ubicacion
            throw new CatalogItemInUseException(
                    "No se puede eliminar '" + entity.getName()
                            + "' porque tiene registros asociados");
        }
        writeAudit(actor, "DELETE_CATALOG", type,
                "Se elimino '" + entity.getName() + "' (id " + id + ")");
        return new CatalogDeleteResponse("Elemento eliminado correctamente");
    }

    private CatalogRepository<? extends CatalogEntity> repositoryOf(CatalogType type) {
        return switch (type) {
            case STATUS -> statusRepository;
            case LOCATION -> locationRepository;
            case CATEGORY -> categoryRepository;
            case ACQUISITION_MODE -> acquisitionModeRepository;
        };
    }

    private CatalogEntity find(CatalogType type, Integer id) {
        return repositoryOf(type).findById(id)
                .map(entity -> (CatalogEntity) entity)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe el elemento con id " + id));
    }

    private CatalogEntity saveNew(CatalogType type, String name, String detail) {
        return switch (type) {
            case STATUS -> statusRepository.save(new AssetStatus(name, detail));
            case LOCATION -> locationRepository.save(new Location(name, detail));
            case CATEGORY -> categoryRepository.save(new Category(name, detail));
            case ACQUISITION_MODE -> acquisitionModeRepository.save(new AcquisitionMode(name, detail));
        };
    }

    private void saveAny(CatalogType type, CatalogEntity entity) {
        switch (type) {
            case STATUS -> statusRepository.save((AssetStatus) entity);
            case LOCATION -> locationRepository.save((Location) entity);
            case CATEGORY -> categoryRepository.save((Category) entity);
            case ACQUISITION_MODE -> acquisitionModeRepository.save((AcquisitionMode) entity);
        }
    }

    private void deleteAny(CatalogType type, CatalogEntity entity) {
        switch (type) {
            case STATUS -> {
                statusRepository.delete((AssetStatus) entity);
                statusRepository.flush();
            }
            case LOCATION -> {
                locationRepository.delete((Location) entity);
                locationRepository.flush();
            }
            case CATEGORY -> {
                categoryRepository.delete((Category) entity);
                categoryRepository.flush();
            }
            case ACQUISITION_MODE -> {
                acquisitionModeRepository.delete((AcquisitionMode) entity);
                acquisitionModeRepository.flush();
            }
        }
    }

    private long usageOf(CatalogType type, Integer id) {
        return switch (type) {
            case STATUS -> assetRepository.countByStatus_Id(id);
            case LOCATION -> assetRepository.countByLocation_Id(id);
            case CATEGORY -> assetRepository.countByCategory_Id(id);
            case ACQUISITION_MODE -> assetRepository.countByAcquisitionMode_Id(id);
        };
    }

    private CatalogEntryResponse toResponse(CatalogType type, CatalogEntity entity) {
        long usage = usageOf(type, entity.getId());
        return new CatalogEntryResponse(
                entity.getId(), entity.getName(), entity.getDetail(), usage, usage == 0);
    }

    private String cleanName(CatalogType type, CatalogEntryRequest request) {
        String name = request == null || request.getName() == null ? "" : request.getName().trim();
        if (name.isEmpty()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (name.length() > type.getMaxNameLength()) {
            throw new IllegalArgumentException(
                    "El nombre no puede superar " + type.getMaxNameLength() + " caracteres");
        }
        return name;
    }

    private String cleanDetail(CatalogType type, CatalogEntryRequest request) {
        String detail = request.getDetail() == null ? "" : request.getDetail().trim();
        if (detail.isEmpty()) {
            if (type.isDetailRequired()) {
                throw new IllegalArgumentException("El edificio es obligatorio");
            }
            return null;
        }
        if (type.isDetailRequired() && detail.length() > 100) {
            throw new IllegalArgumentException("El edificio no puede superar 100 caracteres");
        }
        return detail;
    }

    private void writeAudit(User actor, String action, CatalogType type, String details) {
        Audit audit = new Audit();
        audit.setUser(actor);
        audit.setAction(action);
        audit.setAffectedTable(type.getTable());
        audit.setDetails(details);
        auditRepository.save(audit);
    }

    private User currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null || authentication.getName().isBlank()
                || "anonymousUser".equals(authentication.getName())) {
            throw new IllegalStateException(
                    "No se pudo identificar al usuario que realiza la operacion");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException(
                        "No se encontro al usuario autenticado para auditoria"));
    }
}
