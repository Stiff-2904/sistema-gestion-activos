package cr.go.ctposa.assetmanagement.dto.user;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CreateUserRequestTest {

    private Validator validator;
    private ValidatorFactory factory;

    @BeforeEach
    void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterEach
    void tearDown() {
        factory.close();
    }

    private CreateUserRequest validRequest() {
        CreateUserRequest request = new CreateUserRequest();
        request.setName("Ana Perez");
        request.setEmail("ana@ctposa.ac.cr");
        request.setPassword("123456");
        request.setRole("BASIC_USER");
        return request;
    }

    private boolean hasViolation(CreateUserRequest request, String property) {
        return validator.validate(request).stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals(property));
    }

    @Test
    void validation_MissingMandatoryFields_GeneratesViolations() {
        CreateUserRequest emptyRequest = new CreateUserRequest();

        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(emptyRequest);

        assertFalse(violations.isEmpty());
        
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().equals("El nombre es obligatorio")));
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().equals("El correo es obligatorio")));
    }

    @Test
    void validation_ValidRequest_HasNoErrors() {
        assertTrue(validator.validate(validRequest()).isEmpty());
    }

    @Test
    void validation_EmptyName_IsRejected() {
        CreateUserRequest request = validRequest();
        request.setName("   ");
        assertTrue(hasViolation(request, "name"));
    }

    @Test
    void validation_BadEmailFormat_IsRejected() {
        CreateUserRequest request = validRequest();
        request.setEmail("no-es-un-correo");
        assertTrue(hasViolation(request, "email"));
    }

    @Test
    void validation_EmptyEmail_IsRejected() {
        CreateUserRequest request = validRequest();
        request.setEmail("  ");
        assertTrue(hasViolation(request, "email"));
    }

    @Test
    void validation_EmptyPassword_IsRejected() {
        CreateUserRequest request = validRequest();
        request.setPassword("  ");
        assertTrue(hasViolation(request, "password"));
    }

    @Test
    void validation_ShortPassword_IsRejected() {
        CreateUserRequest request = validRequest();
        request.setPassword("12345");
        assertTrue(hasViolation(request, "password"));
    }

    @Test
    void validation_MissingRole_IsRejected() {
        CreateUserRequest request = validRequest();
        request.setRole("");
        assertTrue(hasViolation(request, "role"));
    }

    @Test
    void validation_TooLongName_IsRejected() {
        CreateUserRequest request = validRequest();
        request.setName("A".repeat(101));
        assertTrue(hasViolation(request, "name"));
    }

    @Test
    void validation_TooLongRole_IsRejected() {
        CreateUserRequest request = validRequest();
        request.setRole("R".repeat(51));
        assertTrue(hasViolation(request, "role"));
    }

}