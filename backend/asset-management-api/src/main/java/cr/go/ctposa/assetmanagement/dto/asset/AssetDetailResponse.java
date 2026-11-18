package cr.go.ctposa.assetmanagement.dto.asset;

import java.math.BigDecimal;

/** HU-GA-02: datos de consulta de un activo, sin exponer entidades JPA. */
public record AssetDetailResponse(
        Integer id,
        String assetNumber,
        String description,
        String brand,
        String model,
        String serial,
        BigDecimal price,
        Integer statusId,
        String status,
        Integer locationId,
        String location,
        Integer categoryId,
        String category,
        Integer acquisitionModeId,
        String acquisitionMode,
        Integer currentResponsibleId,
        String currentResponsible,
        Boolean decommissioned,
        String notes) {
}
