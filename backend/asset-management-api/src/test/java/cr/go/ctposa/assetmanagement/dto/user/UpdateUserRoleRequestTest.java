package cr.go.ctposa.assetmanagement.dto.user;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UpdateUserRoleRequestTest {

    private static UpdateUserRoleRequest requestWith(String role) {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest();
        request.setRole(role);
        return request;
    }

    // CA03: no se selecciona un rol
    @Test
    void role_NullEmptyOrBlank_IsRejected() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            assertFalse(validator.validate(requestWith(null)).isEmpty());
            assertFalse(validator.validate(requestWith("")).isEmpty());
            assertFalse(validator.validate(requestWith("   ")).isEmpty());
        }
    }

    // CA01: un rol con valor y longitud correctos es aceptado
    @Test
    void role_WithValidValue_IsAccepted() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            assertTrue(validator.validate(requestWith("BASIC_USER")).isEmpty());
        }
    }

    @Test
    void role_LongerThan50Characters_IsRejected() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            assertFalse(validator.validate(requestWith("R".repeat(51))).isEmpty());
        }
    }
}
