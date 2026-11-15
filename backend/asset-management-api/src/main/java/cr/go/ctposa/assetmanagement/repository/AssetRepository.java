package cr.go.ctposa.assetmanagement.repository;

import cr.go.ctposa.assetmanagement.model.Asset;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<Asset, Integer> {

    boolean existsByAssetNumber(String assetNumber);

    List<Asset> findAllByOrderByIdDesc();
}
