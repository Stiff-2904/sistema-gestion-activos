package cr.go.ctposa.assetmanagement.repository;

import cr.go.ctposa.assetmanagement.model.Audit;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditRepository extends JpaRepository<Audit, Integer> {
    boolean existsByUser_Id(Integer id);

    /** Trazabilidad de una tabla: los detalles empiezan con un prefijo que identifica el registro. */
    List<Audit> findByAffectedTableAndDetailsStartingWithOrderByIdAsc(String affectedTable, String detailsPrefix);
}
