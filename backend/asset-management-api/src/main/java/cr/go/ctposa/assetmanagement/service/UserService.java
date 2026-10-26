package cr.go.ctposa.assetmanagement.service;

import cr.go.ctposa.assetmanagement.dto.user.CreateUserRequest;
import cr.go.ctposa.assetmanagement.dto.user.CreateUserResponse;
import cr.go.ctposa.assetmanagement.dto.user.UpdateUserRequest;
import cr.go.ctposa.assetmanagement.model.Audit;
import cr.go.ctposa.assetmanagement.model.Role;
import cr.go.ctposa.assetmanagement.model.User;
import cr.go.ctposa.assetmanagement.repository.AuditRepository;
import cr.go.ctposa.assetmanagement.repository.RoleRepository;
import cr.go.ctposa.assetmanagement.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditRepository auditRepository;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuditRepository auditRepository) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditRepository = auditRepository;
    }

    @Transactional
    public CreateUserResponse createUser(CreateUserRequest request) {

        // CA03: el correo reemplaza al username en el esquema acordado.
        // Normalizar evita que espacios y mayusculas se traten como usuarios distintos.
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException(
                    "Ya existe un usuario con ese correo"
            );
        }

        // Se conserva la asignacion del rol elegido por el superusuario.
        Role role = roleRepository
                .findByName(request.getRole().trim())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "El rol indicado no existe"
                        )
                );

        // El filtro JWT establece el correo del usuario autenticado
        // como principal. Esta persona sera la responsable de la accion.
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()
                || "anonymousUser".equals(authentication.getName())) {
            throw new IllegalStateException(
                    "No se pudo identificar al usuario que realiza el registro"
            );
        }

        User actor = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException(
                        "No se encontro al usuario autenticado para auditoria"
                ));

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );
        user.setRole(role);
        user.setActive(true);

        User savedUser = userRepository.save(user);

        // CA01: registrar trazabilidad SIN almacenar la contrasena.
        Audit audit = new Audit();
        audit.setUser(actor);
        audit.setAction("CREATE_USER");
        audit.setAffectedTable("usuario");
        audit.setDetails(
                "Usuario creado: id=" + savedUser.getId()
                + ", correo=" + savedUser.getEmail()
                + ", rol=" + role.getName()
        );
        auditRepository.save(audit);

        // @Transactional permite revertir ambos registros si falla
        // el guardado de la auditoria.
        return new CreateUserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole().getName(),
                savedUser.getActive()
        );
    }
    /** HU-GU-03: actualizar usuario y guardar auditoría en una sola transacción. */
    @Transactional
    public CreateUserResponse updateUser(Integer id, UpdateUserRequest request) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("El usuario con el ID indicado no existe"));

        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (!existing.getEmail().equals(normalizedEmail)) {
            userRepository.findByEmail(normalizedEmail).ifPresent(another -> {
                if (!another.getId().equals(existing.getId())) {
                    throw new IllegalArgumentException("Ya existe otro usuario con ese correo");
                }
            });
        }
        Role newRole = roleRepository.findByName(request.getRole().trim())
                .orElseThrow(() -> new IllegalArgumentException("El rol indicado no existe"));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null || authentication.getName().isBlank()
                || "anonymousUser".equals(authentication.getName())) {
            throw new IllegalStateException("No se pudo identificar al usuario que realiza la actualización");
        }
        User actor = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException(
                        "No se encontro al usuario autenticado para auditoria"));

        String oldEmail = existing.getEmail();
        String oldRole = existing.getRole().getName();
        boolean passwordChanged = request.getPassword() != null && !request.getPassword().isEmpty();

        existing.setName(request.getName().trim());
        existing.setEmail(normalizedEmail);
        existing.setRole(newRole);
        if (passwordChanged) {
            existing.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        User saved = userRepository.save(existing);

        Audit audit = new Audit();
        audit.setUser(actor);
        audit.setAction("UPDATE_USER");
        audit.setAffectedTable("usuario");
        audit.setDetails("Usuario actualizado: id=" + saved.getId()
                + ", correo anterior=" + oldEmail
                + ", correo nuevo=" + saved.getEmail()
                + ", rol anterior=" + oldRole
                + ", rol nuevo=" + newRole.getName()
                + ", contrasena modificada=" + passwordChanged);
        auditRepository.save(audit);

        return new CreateUserResponse(
                saved.getId(), saved.getName(), saved.getEmail(),
                saved.getRole().getName(), saved.getActive());
    }
}
