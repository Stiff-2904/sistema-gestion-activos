package cr.go.ctposa.assetmanagement.dto.asset;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class CreateAssetRequest {

    @NotBlank(message = "El numero de identificacion es obligatorio")
    @Size(max = 50, message = "El numero de identificacion no puede superar los 50 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9._/-]*$",
            message = "El numero de identificacion solo admite letras, numeros, punto, guion y barra")
    private String assetNumber;

    @NotBlank(message = "La descripcion es obligatoria")
    @Size(max = 500, message = "La descripcion no puede superar los 500 caracteres")
    private String description;

    @Size(max = 50, message = "La marca no puede superar los 50 caracteres")
    private String brand;

    @Size(max = 50, message = "El modelo no puede superar los 50 caracteres")
    private String model;

    @Size(max = 50, message = "La serie no puede superar los 50 caracteres")
    private String serial;

    @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El precio admite hasta 10 enteros y 2 decimales")
    private BigDecimal price;

    @NotNull(message = "El estado es obligatorio")
    @Positive(message = "El estado indicado no es valido")
    private Integer statusId;

    @NotNull(message = "La ubicacion es obligatoria")
    @Positive(message = "La ubicacion indicada no es valida")
    private Integer locationId;

    @NotNull(message = "El modo de adquisicion es obligatorio")
    @Positive(message = "El modo de adquisicion indicado no es valido")
    private Integer acquisitionModeId;

    @NotNull(message = "La categoria es obligatoria")
    @Positive(message = "La categoria indicada no es valida")
    private Integer categoryId;

    @Positive(message = "El responsable indicado no es valido")
    private Integer currentResponsibleId;

    @Size(max = 1000, message = "Las observaciones no pueden superar los 1000 caracteres")
    private String notes;

    public CreateAssetRequest() {
    }

    public String getAssetNumber() { return assetNumber; }
    public void setAssetNumber(String assetNumber) { this.assetNumber = assetNumber; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getSerial() { return serial; }
    public void setSerial(String serial) { this.serial = serial; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getStatusId() { return statusId; }
    public void setStatusId(Integer statusId) { this.statusId = statusId; }
    public Integer getLocationId() { return locationId; }
    public void setLocationId(Integer locationId) { this.locationId = locationId; }
    public Integer getAcquisitionModeId() { return acquisitionModeId; }
    public void setAcquisitionModeId(Integer acquisitionModeId) { this.acquisitionModeId = acquisitionModeId; }
    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }
    public Integer getCurrentResponsibleId() { return currentResponsibleId; }
    public void setCurrentResponsibleId(Integer currentResponsibleId) { this.currentResponsibleId = currentResponsibleId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
