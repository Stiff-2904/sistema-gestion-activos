package cr.go.ctposa.assetmanagement.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

/**
 * Mapea la tabla "bien" de control_activos.
 * id_acta no se mapea: solo aplica a la baja de un activo y queda en NULL al registrarlo.
 */
@Entity
@Table(name = "bien")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_bien")
    private Integer id;

    @Column(name = "numero_id", nullable = false, unique = true, length = 50)
    private String assetNumber;

    @Column(name = "descripcion", nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "marca", length = 50)
    private String brand;

    @Column(name = "modelo", length = 50)
    private String model;

    @Column(name = "serie", length = 50)
    private String serial;

    @Column(name = "precio", precision = 12, scale = 2)
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_estado", nullable = false)
    private AssetStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_ubicacion", nullable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_modo", nullable = false)
    private AcquisitionMode acquisitionMode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_categoria", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_responsable_actual")
    private User currentResponsible;

    @Column(name = "dado_baja", nullable = false)
    private Boolean decommissioned = false;

    @Column(name = "observaciones", columnDefinition = "text")
    private String notes;

    public Asset() {
    }

    public Integer getId() {
        return id;
    }

    public String getAssetNumber() {
        return assetNumber;
    }

    public void setAssetNumber(String assetNumber) {
        this.assetNumber = assetNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getSerial() {
        return serial;
    }

    public void setSerial(String serial) {
        this.serial = serial;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public AcquisitionMode getAcquisitionMode() {
        return acquisitionMode;
    }

    public void setAcquisitionMode(AcquisitionMode acquisitionMode) {
        this.acquisitionMode = acquisitionMode;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public User getCurrentResponsible() {
        return currentResponsible;
    }

    public void setCurrentResponsible(User currentResponsible) {
        this.currentResponsible = currentResponsible;
    }

    public Boolean getDecommissioned() {
        return decommissioned;
    }

    public void setDecommissioned(Boolean decommissioned) {
        this.decommissioned = decommissioned;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
