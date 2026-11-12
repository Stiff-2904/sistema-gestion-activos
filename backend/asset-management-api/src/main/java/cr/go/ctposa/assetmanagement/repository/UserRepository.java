package cr.go.ctposa.assetmanagement.repository;

import cr.go.ctposa.assetmanagement.model.User;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    /** Bloquea el registro hasta terminar la eliminación y sus validaciones. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Integer id);

    long countByRoleNameAndActive(String roleName, Boolean active);
}