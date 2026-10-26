package cr.go.ctposa.assetmanagement.repository;

import cr.go.ctposa.assetmanagement.model.Audit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditRepository extends JpaRepository<Audit, Integer> {
}
