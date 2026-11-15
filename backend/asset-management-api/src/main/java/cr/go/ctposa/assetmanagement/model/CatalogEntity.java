package cr.go.ctposa.assetmanagement.model;

/** Contrato comun de los cuatro catalogos (estado, ubicacion, categoria, modo de adquisicion). */
public interface CatalogEntity {

    Integer getId();

    String getName();

    void setName(String name);

    /** Segundo dato del catalogo: edificio en ubicacion, descripcion en los demas. */
    String getDetail();

    void setDetail(String detail);
}
