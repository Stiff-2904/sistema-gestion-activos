package cr.go.ctposa.assetmanagement.repository;

import cr.go.ctposa.assetmanagement.model.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetStatusRepository extends JpaRepository<AssetStatus, Integer> {
}
