package cr.go.ctposa.assetmanagement.dto.user;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UpdateUserRequestTest {
    private static UpdateUserRequest valid() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setName("Ana");
        request.setEmail("ana@ctposa.ac.cr");
        request.setRole("BASIC_USER");
        return request;
    }

    @Test
    void optionalPasswordAllowsNullAndEmptyButNotShortValues() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            UpdateUserRequest request = valid();
            assertTrue(validator.validate(request).isEmpty());
            request.setPassword("");
            assertTrue(validator.validate(request).isEmpty());
            request.setPassword("12345");
            assertFalse(validator.validate(request).isEmpty());
            request.setPassword("123456");
            assertTrue(validator.validate(request).isEmpty());
        }
    }
}
