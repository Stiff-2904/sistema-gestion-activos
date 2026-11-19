package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.asset.AssetAuditResponse;
import cr.go.ctposa.assetmanagement.dto.asset.AssetCatalogResponse;
import cr.go.ctposa.assetmanagement.dto.asset.AssetDetailResponse;
import cr.go.ctposa.assetmanagement.dto.asset.AssetResponse;
import cr.go.ctposa.assetmanagement.dto.asset.CatalogItemResponse;
import cr.go.ctposa.assetmanagement.dto.asset.CreateAssetRequest;
import cr.go.ctposa.assetmanagement.dto.asset.UpdateAssetRequest;
import cr.go.ctposa.assetmanagement.exception.AssetNotFoundException;
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
import java.util.List;
import java.util.Objects;
import java.util.StringJoiner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetService {

    private static final String AUDIT_TABLE = "bien";

    private final AssetRepository assetRepository;
    private final AssetStatusRepository statusRepository;
    private final LocationRepository locationRepository;
    private final CategoryRepository categoryRepository;
    private final AcquisitionModeRepository acquisitionModeRepository;
    private final UserRepository userRepository;
    private final AuditRepository auditRepository;

    public AssetService(
            AssetRepository assetRepository,
            AssetStatusRepository statusRepository,
            LocationRepository locationRepository,
            CategoryRepository categoryRepository,
            AcquisitionModeRepository acquisitionModeRepository,
            UserRepository userRepository,
            AuditRepository auditRepository) {

        this.assetRepository = assetRepository;
        this.statusRepository = statusRepository;
        this.locationRepository = locationRepository;
        this.categoryRepository = categoryRepository;
        this.acquisitionModeRepository = acquisitionModeRepository;
        this.userRepository = userRepository;
        this.auditRepository = auditRepository;
    }

    /** HU-GA-01: registrar un activo y guardar su trazabilidad en una sola transaccion. */
    @Transactional
    public AssetResponse createAsset(CreateAssetRequest request) {

        String assetNumber = request.getAssetNumber().trim();

        // CA04: el numero de identificacion es unico entre todos los activos.
        if (assetRepository.existsByAssetNumber(assetNumber)) {
            throw new IllegalArgumentException(
                    "Ya existe un activo con ese numero de identificacion");
        }

        // Los datos de catalogo deben existir realmente en la base de datos.
        AssetStatus status = statusRepository.findById(request.getStatusId())
                .orElseThrow(() -> new IllegalArgumentException("El estado indicado no existe"));
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new IllegalArgumentException("La ubicacion indicada no existe"));
        AcquisitionMode acquisitionMode = acquisitionModeRepository
                .findById(request.getAcquisitionModeId())
                .orElseThrow(() -> new IllegalArgumentException("El modo de adquisicion indicado no existe"));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("La categoria indicada no existe"));

        User responsible = null;
        if (request.getCurrentResponsibleId() != null) {
            responsible = userRepository.findById(request.getCurrentResponsibleId())
                    .orElseThrow(() -> new IllegalArgumentException("El responsable indicado no existe"));
            if (!Boolean.TRUE.equals(responsible.getActive())) {
                throw new IllegalArgumentException("El responsable indicado esta inactivo");
            }
        }

        User actor = currentActor();

        Asset asset = new Asset();
        asset.setAssetNumber(assetNumber);
        asset.setDescription(request.getDescription().trim());
        asset.setBrand(blankToNull(request.getBrand()));
        asset.setModel(blankToNull(request.getModel()));
        asset.setSerial(blankToNull(request.getSerial()));
        asset.setPrice(request.getPrice());
        asset.setStatus(status);
        asset.setLocation(location);
        asset.setAcquisitionMode(acquisitionMode);
        asset.setCategory(category);
        asset.setCurrentResponsible(responsible);
        asset.setDecommissioned(false);
        asset.setNotes(blankToNull(request.getNotes()));

        Asset saved;
        try {
            saved = assetRepository.save(asset);
        } catch (DataIntegrityViolationException ex) {
            // Dos registros simultaneos con el mismo numero: gana el primero.
            throw new IllegalArgumentException(
                    "No se pudo guardar el activo: el numero de identificacion ya existe");
        }

        // Trazabilidad: quien (usuario), cuando (fecha_hora de MySQL) y que activo (id_activo).
        Audit audit = new Audit();
        audit.setUser(actor);
        audit.setAction("CREATE_ASSET");
        audit.setAffectedTable(AUDIT_TABLE);
        audit.setDetails(auditPrefix(saved.getId())
                + " Activo creado: numero_id=" + saved.getAssetNumber()
                + ", categoria=" + category.getName()
                + ", estado=" + status.getName()
                + ", ubicacion=" + location.getName());
        auditRepository.save(audit);

        return toResponse(saved);
    }

    /** Lista de activos para comprobar que el registro quedo guardado. */
    @Transactional(readOnly = true)
    public List<AssetResponse> listAssets() {
        return assetRepository.findAllByOrderByIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    /** HU-GA-02 / CA01-CA02: consulta detallada, sin cambios ni auditoria de escritura. */
    @Transactional(readOnly = true)
    public AssetDetailResponse getAssetDetail(Integer id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("El ID del activo debe ser un numero positivo");
        }
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new AssetNotFoundException(id));
        return toDetailResponse(asset);
    }

    /** HU-GA-03: actualizacion y trazabilidad atomicas; la baja no es editable aqui. */
    @Transactional
    public AssetDetailResponse updateAsset(Integer id, UpdateAssetRequest request) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("El ID del activo debe ser un numero positivo");
        }
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new AssetNotFoundException(id));
        String assetNumber = request.getAssetNumber().trim();
        if (!assetNumber.equals(asset.getAssetNumber()) && assetRepository.existsByAssetNumber(assetNumber)) {
            throw new IllegalArgumentException("Ya existe un activo con ese numero de identificacion");
        }

        AssetStatus status = statusRepository.findById(request.getStatusId())
                .orElseThrow(() -> new IllegalArgumentException("El estado indicado no existe"));
        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new IllegalArgumentException("La ubicacion indicada no existe"));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("La categoria indicada no existe"));
        AcquisitionMode acquisitionMode = acquisitionModeRepository.findById(request.getAcquisitionModeId())
                .orElseThrow(() -> new IllegalArgumentException("El modo de adquisicion indicado no existe"));
        User responsible = null;
        if (request.getCurrentResponsibleId() != null) {
            responsible = userRepository.findById(request.getCurrentResponsibleId())
                    .orElseThrow(() -> new IllegalArgumentException("El responsable indicado no existe"));
            if (!Boolean.TRUE.equals(responsible.getActive())) {
                throw new IllegalArgumentException("El responsable indicado esta inactivo");
            }
        }

        // Identificamos primero al usuario; si falla, no se toca el activo.
        User actor = currentActor();
        StringJoiner changes = new StringJoiner("; ");
        addChange(changes, "numero_id", asset.getAssetNumber(), assetNumber);
        addChange(changes, "descripcion", asset.getDescription(), request.getDescription().trim());
        addChange(changes, "marca", asset.getBrand(), blankToNull(request.getBrand()));
        addChange(changes, "modelo", asset.getModel(), blankToNull(request.getModel()));
        addChange(changes, "serie", asset.getSerial(), blankToNull(request.getSerial()));
        addChange(changes, "precio", asset.getPrice(), request.getPrice());
        addChange(changes, "estado_id", asset.getStatus().getId(), status.getId());
        addChange(changes, "ubicacion_id", asset.getLocation().getId(), location.getId());
        addChange(changes, "categoria_id", asset.getCategory().getId(), category.getId());
        addChange(changes, "modo_id", asset.getAcquisitionMode().getId(), acquisitionMode.getId());
        addChange(changes, "responsable_id",
                asset.getCurrentResponsible() == null ? null : asset.getCurrentResponsible().getId(),
                responsible == null ? null : responsible.getId());
        addChange(changes, "observaciones", asset.getNotes(), blankToNull(request.getNotes()));

        asset.setAssetNumber(assetNumber);
        asset.setDescription(request.getDescription().trim());
        asset.setBrand(blankToNull(request.getBrand()));
        asset.setModel(blankToNull(request.getModel()));
        asset.setSerial(blankToNull(request.getSerial()));
        asset.setPrice(request.getPrice());
        asset.setStatus(status);
        asset.setLocation(location);
        asset.setCategory(category);
        asset.setAcquisitionMode(acquisitionMode);
        asset.setCurrentResponsible(responsible);
        asset.setNotes(blankToNull(request.getNotes()));
        // No se modifica dado_baja: corresponde a otra operacion de negocio.

        if (changes.length() == 0) return toDetailResponse(asset);
        Asset saved;
        try {
            saved = assetRepository.save(asset);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("No se pudo actualizar: el numero de identificacion ya existe");
        }
        Audit audit = new Audit();
        audit.setUser(actor);
        audit.setAction("UPDATE_ASSET");
        audit.setAffectedTable(AUDIT_TABLE);
        audit.setDetails(auditPrefix(saved.getId()) + " Cambios: " + changes);
        auditRepository.save(audit);
        return toDetailResponse(saved);
    }

    private void addChange(StringJoiner changes, String field, Object before, Object after) {
        if (!Objects.equals(before, after)) {
            changes.add(field + " [" + formatAuditValue(before) + " -> " + formatAuditValue(after) + "]");
        }
    }

    private String formatAuditValue(Object value) {
        if (value == null) return "(vacio)";
        return String.valueOf(value).replace("\r", " ").replace("\n", " ")
                .replace(";", ",").replace("[", "(").replace("]", ")");
    }

    /** Opciones de las listas desplegables del formulario. */
    @Transactional(readOnly = true)
    public AssetCatalogResponse getCatalog() {
        return new AssetCatalogResponse(
                statusRepository.findAll().stream()
                        .map(item -> new CatalogItemResponse(item.getId(), item.getName())).toList(),
                locationRepository.findAll().stream()
                        .map(item -> new CatalogItemResponse(
                                item.getId(), item.getName() + " - " + item.getBuilding())).toList(),
                categoryRepository.findAll().stream()
                        .map(item -> new CatalogItemResponse(item.getId(), item.getName())).toList(),
                acquisitionModeRepository.findAll().stream()
                        .map(item -> new CatalogItemResponse(item.getId(), item.getName())).toList(),
                userRepository.findByActiveTrueOrderByNameAsc().stream()
                        .map(item -> new CatalogItemResponse(
                                item.getId(), item.getName() + " (" + item.getEmail() + ")")).toList());
    }

    /** Trazabilidad de un activo, solo para el superusuario. */
    @Transactional(readOnly = true)
    public List<AssetAuditResponse> getAssetAudit(Integer id) {
        if (!assetRepository.existsById(id)) {
            throw new IllegalArgumentException("El activo con el ID indicado no existe");
        }
        return auditRepository
                .findByAffectedTableAndDetailsStartingWithOrderByIdAsc(AUDIT_TABLE, auditPrefix(id))
                .stream()
                .map(audit -> new AssetAuditResponse(
                        audit.getId(),
                        audit.getAction(),
                        audit.getUser() == null ? null : audit.getUser().getEmail(),
                        audit.getDateTime(),
                        audit.getDetails()))
                .toList();
    }

    // El prefijo identifica el activo sin ambiguedad: "id_activo=5;" nunca coincide con "id_activo=50;".
    private String auditPrefix(Integer assetId) {
        return "id_activo=" + assetId + ";";
    }

    private User currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null || authentication.getName().isBlank()
                || "anonymousUser".equals(authentication.getName())) {
            throw new IllegalStateException(
                    "No se pudo identificar al usuario que realiza el registro");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException(
                        "No se encontro al usuario autenticado para auditoria"));
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private AssetDetailResponse toDetailResponse(Asset asset) {
        return new AssetDetailResponse(
                asset.getId(),
                asset.getAssetNumber(),
                asset.getDescription(),
                asset.getBrand(),
                asset.getModel(),
                asset.getSerial(),
                asset.getPrice(),
                asset.getStatus().getId(),
                asset.getStatus().getName(),
                asset.getLocation().getId(),
                asset.getLocation().getName(),
                asset.getCategory().getId(),
                asset.getCategory().getName(),
                asset.getAcquisitionMode().getId(),
                asset.getAcquisitionMode().getName(),
                asset.getCurrentResponsible() == null ? null : asset.getCurrentResponsible().getId(),
                asset.getCurrentResponsible() == null ? null : asset.getCurrentResponsible().getName(),
                asset.getDecommissioned(),
                asset.getNotes());
    }

    private AssetResponse toResponse(Asset asset) {
        return new AssetResponse(
                asset.getId(),
                asset.getAssetNumber(),
                asset.getDescription(),
                asset.getBrand(),
                asset.getModel(),
                asset.getSerial(),
                asset.getPrice(),
                asset.getStatus().getName(),
                asset.getLocation().getName(),
                asset.getCategory().getName(),
                asset.getAcquisitionMode().getName(),
                asset.getCurrentResponsible() == null ? null : asset.getCurrentResponsible().getName(),
                asset.getDecommissioned(),
                asset.getNotes());
    }
}
