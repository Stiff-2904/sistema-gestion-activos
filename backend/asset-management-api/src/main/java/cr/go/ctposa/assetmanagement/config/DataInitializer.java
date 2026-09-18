package cr.go.ctposa.assetmanagement.config;

import cr.go.ctposa.assetmanagement.model.Role;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.RoleRepository;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Value("${bootstrap.superuser.name}")
    private String superuserName;

    @Value("${bootstrap.superuser.email}")
    private String superuserEmail;

    @Value("${bootstrap.superuser.password}")
    private String superuserPassword;

    @Bean
    public CommandLineRunner initializeData(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            createRoles(roleRepository);
            createSuperuser(userRepository, roleRepository, passwordEncoder);
        };
    }

    private void createRoles(RoleRepository roleRepository) {
        createRoleIfNotExists(
                roleRepository,
                "SUPERUSER",
                "Super usuario del sistema",
                "ALL"
        );

        createRoleIfNotExists(
                roleRepository,
                "INTERMEDIATE_USER",
                "Usuario intermedio del sistema",
                "ASSET_READ,ASSET_UPDATE_STATUS,ASSET_MOVE,ASSET_DEACTIVATE,"
                + "ASSET_REACTIVATE,ASSET_MAINTENANCE,ASSET_HISTORY,"
                + "INVENTORY_READ,INVENTORY_SEARCH,INVENTORY_FILTER,"
                + "LOAN_CREATE,LOAN_RETURN,LOAN_READ,LOAN_UPDATE,LOAN_HISTORY,"
                + "VERIFICATION_CREATE"
        );

        createRoleIfNotExists(
                roleRepository,
                "BASIC_USER",
                "Usuario basico del sistema",
                "ASSET_READ,ASSET_HISTORY,"
                + "INVENTORY_READ,INVENTORY_SEARCH,INVENTORY_FILTER,"
                + "LOAN_READ,LOAN_HISTORY"
        );
    }

    private void createSuperuser(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {

        if (userRepository.count() > 0) {
            return;
        }

        Role superuserRole = roleRepository
                .findByName("SUPERUSER")
                .orElseThrow();

        User superuser = new User();
        superuser.setName(superuserName);
        superuser.setEmail(superuserEmail);
        superuser.setPasswordHash(
                passwordEncoder.encode(superuserPassword)
        );
        superuser.setRole(superuserRole);
        superuser.setActive(true);

        userRepository.save(superuser);

        System.out.println("Usuario SUPERUSER inicial creado.");
    }

    private void createRoleIfNotExists(
            RoleRepository roleRepository,
            String name,
            String description,
            String permissions) {

        if (roleRepository.findByName(name).isEmpty()) {
            Role role = new Role(name, description, permissions);
            roleRepository.save(role);

            System.out.println("Rol creado: " + name);
        }
    }
}