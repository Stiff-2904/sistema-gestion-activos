package cr.go.ctposa.assetmanagement.dto.user;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CreateUserRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    @Test
    void validation_MissingMandatoryFields_GeneratesViolations() {
        CreateUserRequest emptyRequest = new CreateUserRequest();

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(emptyRequest);

        assertFalse(violations.isEmpty());
        
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().equals("El nombre es obligatorio")));
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().equals("El correo es obligatorio")));
    }
}