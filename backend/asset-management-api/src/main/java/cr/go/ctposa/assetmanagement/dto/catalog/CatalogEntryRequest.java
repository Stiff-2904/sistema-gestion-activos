package cr.go.ctposa.assetmanagement.dto.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Datos para crear o editar un elemento de catalogo. */
public class CatalogEntryRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String name;

    @Size(max = 500, message = "El detalle no puede superar 500 caracteres")
    private String detail;

    public CatalogEntryRequest() {
    }

    public CatalogEntryRequest(String name, String detail) {
        this.name = name;
        this.detail = detail;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }
}
