package cr.go.ctposa.assetmanagement.repository;

import cr.go.ctposa.assetmanagement.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
}
