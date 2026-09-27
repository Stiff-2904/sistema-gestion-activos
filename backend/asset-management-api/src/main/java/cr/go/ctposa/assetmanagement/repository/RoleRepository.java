package cr.go.ctposa.assetmanagement.repository;

import cr.go.ctposa.assetmanagement.model.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByName(String name);
}