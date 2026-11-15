package cr.go.ctposa.assetmanagement.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Catalogo de estados fisicos de un activo (tabla estado). */
@Entity
@Table(name = "estado")
public class AssetStatus implements CatalogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_estado")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 50)
    private String name;

    @Column(name = "descripcion", columnDefinition = "text")
    private String description;

    public AssetStatus() {
    }

    public AssetStatus(String name, String description) {
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
