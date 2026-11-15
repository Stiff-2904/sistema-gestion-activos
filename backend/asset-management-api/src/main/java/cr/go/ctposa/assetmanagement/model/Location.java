package cr.go.ctposa.assetmanagement.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Catalogo de ubicaciones donde se guarda un activo (tabla ubicacion). */
@Entity
@Table(name = "ubicacion")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ubicacion")
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String name;

    @Column(name = "edificio", nullable = false, length = 100)
    private String building;

    public Location() {
    }

    public Location(String name, String building) {
        this.name = name;
        this.building = building;
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBuilding() {
        return building;
    }
}
