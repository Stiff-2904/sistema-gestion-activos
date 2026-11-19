package cr.go.ctposa.assetmanagement.dto.asset;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UpdateAssetRequestTest {
    private UpdateAssetRequest validRequest() {
        UpdateAssetRequest request = new UpdateAssetRequest();
        request.setAssetNumber("ACT-2026-001");
        request.setDescription("Computadora actualizada");
        request.setStatusId(1);
        request.setLocationId(2);
        request.setCategoryId(3);
        request.setAcquisitionModeId(4);
        return request;
    }
    private Set<String> invalidFields(UpdateAssetRequest request) {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            return validator.validate(request).stream()
                    .map(v -> v.getPropertyPath().toString()).collect(Collectors.toSet());
        }
    }

    // HU-GA-03 CA02: obligatorios incompletos.
    @Test
    void updateRequest_MissingRequiredFields_RejectsWithoutPut() {
        UpdateAssetRequest request = validRequest();
        request.setDescription("  ");
        request.setStatusId(null);
        assertTrue(invalidFields(request).containsAll(Set.of("description", "statusId")));
    }

    // HU-GA-03 CA03: identificacion, precio y catalogo con formato incorrecto.
    @Test
    void updateRequest_InvalidFormats_Rejects() {
        UpdateAssetRequest request = validRequest();
        request.setAssetNumber("ACT ###");
        request.setPrice(new BigDecimal("12.345"));
        request.setLocationId(-2);
        assertTrue(invalidFields(request).containsAll(Set.of("assetNumber", "price", "locationId")));
    }

    @Test
    void updateRequest_ValidData_HasNoViolations() {
        assertTrue(invalidFields(validRequest()).isEmpty());
    }
}
