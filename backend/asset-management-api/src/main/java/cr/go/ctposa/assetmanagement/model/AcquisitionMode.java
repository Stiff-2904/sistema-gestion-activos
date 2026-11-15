package cr.go.ctposa.assetmanagement.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Catalogo de modos de adquisicion de un activo (tabla modo_adquisicion). */
@Entity
@Table(name = "modo_adquisicion")
public class AcquisitionMode implements CatalogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_modo")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String name;

    @Column(name = "descripcion", columnDefinition = "text")
    private String description;

    public AcquisitionMode() {
    }

    public AcquisitionMode(String name, String description) {
        this.name = name;
        this.description = description;
    }

    @Override
    public Integer getId() {
        return id;
    }

    @Override
    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String getDetail() {
        return description;
    }

    @Override
    public void setDetail(String detail) {
        this.description = detail;
    }
}
