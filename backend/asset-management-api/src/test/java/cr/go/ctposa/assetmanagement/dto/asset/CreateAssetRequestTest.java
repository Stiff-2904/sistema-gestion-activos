package cr.go.ctposa.assetmanagement.dto.asset;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CreateAssetRequestTest {

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

    private CreateAssetRequest validRequest() {
        CreateAssetRequest request = new CreateAssetRequest();
        request.setAssetNumber("ACT-2026-0001");
        request.setDescription("Computadora portatil");
        request.setStatusId(1);
        request.setLocationId(2);
        request.setCategoryId(3);
        request.setAcquisitionModeId(4);
        return request;
    }

    private Set<String> invalidFields(CreateAssetRequest request) {
        return validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());
    }

    // CA01: solo los datos obligatorios ya son un registro valido
    @Test
    void validRequest_WithOnlyRequiredFields_HasNoViolations() {
        assertTrue(validator.validate(validRequest()).isEmpty());
    }

    @Test
    void validRequest_WithAllOptionalFields_HasNoViolations() {
        CreateAssetRequest request = validRequest();
        request.setBrand("Dell");
        request.setModel("Latitude 5440");
        request.setSerial("SN-12345");
        request.setPrice(new BigDecimal("125000.50"));
        request.setCurrentResponsibleId(7);
        request.setNotes("Entregado con cargador");
        assertTrue(validator.validate(request).isEmpty());
    }

    // CA02: datos obligatorios incompletos
    @Test
    void emptyRequest_RejectsEveryRequiredField() {
        Set<String> invalid = invalidFields(new CreateAssetRequest());
        assertEquals(Set.of("assetNumber", "description", "statusId",
                "locationId", "categoryId", "acquisitionModeId"), invalid);
    }

    @Test
    void blankTextFields_AreRejected() {
        CreateAssetRequest request = validRequest();
        request.setAssetNumber("   ");
        request.setDescription("   ");
        assertEquals(Set.of("assetNumber", "description"), invalidFields(request));
    }

    // CA03: formato invalido en los datos
    @Test
    void assetNumber_WithInvalidFormat_IsRejected() {
        for (String number : new String[] {"ACT 001", "-ACT001", "ACT#001", "ACT@001"}) {
            CreateAssetRequest request = validRequest();
            request.setAssetNumber(number);
            assertTrue(invalidFields(request).contains("assetNumber"), number);
        }
    }

    @Test
    void textFields_LongerThanTheDatabaseColumn_AreRejected() {
        CreateAssetRequest request = validRequest();
        request.setAssetNumber("A".repeat(51));
        request.setDescription("D".repeat(501));
        request.setBrand("M".repeat(51));
        request.setModel("M".repeat(51));
        request.setSerial("S".repeat(51));
        request.setNotes("O".repeat(1001));
        assertEquals(Set.of("assetNumber", "description", "brand", "model", "serial", "notes"),
                invalidFields(request));
    }

    @Test
    void price_NegativeOrWithTooManyDigits_IsRejected() {
        for (String price : new String[] {"-1", "10.123", "12345678901"}) {
            CreateAssetRequest request = validRequest();
            request.setPrice(new BigDecimal(price));
            assertTrue(invalidFields(request).contains("price"), price);
        }
    }

    @Test
    void catalogIds_ZeroOrNegative_AreRejected() {
        CreateAssetRequest request = validRequest();
        request.setStatusId(0);
        request.setLocationId(-1);
        request.setCategoryId(0);
        request.setAcquisitionModeId(-5);
        request.setCurrentResponsibleId(0);
        assertEquals(Set.of("statusId", "locationId", "categoryId",
                "acquisitionModeId", "currentResponsibleId"), invalidFields(request));
    }
}
