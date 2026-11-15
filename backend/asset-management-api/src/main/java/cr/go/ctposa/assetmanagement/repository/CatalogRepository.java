package cr.go.ctposa.assetmanagement.repository;

import cr.go.ctposa.assetmanagement.model.CatalogEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

/** Consultas comunes de los catalogos para no repetirlas en cada repositorio. */
@NoRepositoryBean
public interface CatalogRepository<T extends CatalogEntity> extends JpaRepository<T, Integer> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Integer id);

    List<T> findAllByOrderByNameAsc();
}
