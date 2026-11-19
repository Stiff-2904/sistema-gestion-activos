package cr.go.ctposa.assetmanagement.config;

import cr.go.ctposa.assetmanagement.model.AcquisitionMode;
import cr.go.ctposa.assetmanagement.model.AssetStatus;
import cr.go.ctposa.assetmanagement.model.Category;
import cr.go.ctposa.assetmanagement.model.Location;
import cr.go.ctposa.assetmanagement.model.Role;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.AcquisitionModeRepository;
import cr.go.ctposa.assetmanagement.repository.AssetStatusRepository;
import cr.go.ctposa.assetmanagement.repository.CategoryRepository;
import cr.go.ctposa.assetmanagement.repository.LocationRepository;
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
            PasswordEncoder passwordEncoder,
            AssetStatusRepository statusRepository,
            LocationRepository locationRepository,
            CategoryRepository categoryRepository,
            AcquisitionModeRepository acquisitionModeRepository) {

        return args -> {
            createRoles(roleRepository);
            createSuperuser(userRepository, roleRepository, passwordEncoder);
            createAssetCatalogs(statusRepository, locationRepository,
                    categoryRepository, acquisitionModeRepository);
        };
    }

    // HU-GA-01: el formulario necesita opciones en sus listas desplegables.
    // Solo se insertan datos iniciales cuando la tabla esta vacia; luego se administran en la base de datos.
    private void createAssetCatalogs(
            AssetStatusRepository statusRepository,
            LocationRepository locationRepository,
            CategoryRepository categoryRepository,
            AcquisitionModeRepository acquisitionModeRepository) {

        if (statusRepository.count() == 0) {
            statusRepository.save(new AssetStatus("Nuevo", "Activo sin uso previo"));
            statusRepository.save(new AssetStatus("Bueno", "Activo en buen estado de funcionamiento"));
            statusRepository.save(new AssetStatus("Regular", "Activo con desgaste visible pero funcional"));
            statusRepository.save(new AssetStatus("Malo", "Activo con danos o fallas importantes"));
            System.out.println("Estados de activos iniciales creados.");
        }
        if (acquisitionModeRepository.count() == 0) {
            acquisitionModeRepository.save(new AcquisitionMode("Compra", "Adquirido mediante compra"));
            acquisitionModeRepository.save(new AcquisitionMode("Donacion", "Recibido como donacion"));
            acquisitionModeRepository.save(new AcquisitionMode("Traspaso", "Recibido por traspaso entre instituciones"));
            System.out.println("Modos de adquisicion iniciales creados.");
        }
        if (categoryRepository.count() == 0) {
            categoryRepository.save(new Category("Equipo de computo", "Computadoras, impresoras y perifericos"));
            categoryRepository.save(new Category("Mobiliario", "Escritorios, sillas, estantes y similares"));
            categoryRepository.save(new Category("Equipo de laboratorio", "Instrumentos y equipo especializado"));
            categoryRepository.save(new Category("Otros", "Activos que no pertenecen a otra categoria"));
            System.out.println("Categorias de activos iniciales creadas.");
        }
        if (locationRepository.count() == 0) {
            locationRepository.save(new Location("Bodega general", "Edificio principal"));
            System.out.println("Ubicacion inicial creada.");
        }
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

        // Nunca crear un superusuario con credenciales vacías o por defecto.
        if (superuserName.isBlank() || superuserEmail.isBlank() || superuserPassword.isBlank()) {
            System.out.println("Sin superusuario bootstrap: configurar variables BOOTSTRAP_SUPERUSER_* para una BD vacia.");
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
