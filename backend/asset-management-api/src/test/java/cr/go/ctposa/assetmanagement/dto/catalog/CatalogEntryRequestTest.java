package cr.go.ctposa.assetmanagement.dto.catalog;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CatalogEntryRequestTest {

    private ValidatorFactory factory;
    private Validator validator;

    @BeforeEach
    void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterEach
    void tearDown() {
        factory.close();
    }

    // CA02: datos correctos
    @Test
    void validRequest_HasNoViolations() {
        assertTrue(validator.validate(new CatalogEntryRequest("Aula 9", "Edificio B")).isEmpty());
    }

    // CA03: nombre vacio o demasiado largo
    @Test
    void blankName_IsRejected() {
        assertFalse(validator.validate(new CatalogEntryRequest("  ", "Edificio B")).isEmpty());
    }

    @Test
    void tooLongNameOrDetail_IsRejected() {
        assertFalse(validator.validate(new CatalogEntryRequest("x".repeat(101), null)).isEmpty());
        assertFalse(validator.validate(new CatalogEntryRequest("Aula", "x".repeat(501))).isEmpty());
    }
}
