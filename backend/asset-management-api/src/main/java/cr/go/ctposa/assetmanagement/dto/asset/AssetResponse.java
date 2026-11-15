package cr.go.ctposa.assetmanagement.dto.asset;

import java.math.BigDecimal;

public record AssetResponse(
        Integer id, String assetNumber, String description, String brand,
        String model, String serial, BigDecimal price, String status,
        String location, String category, String acquisitionMode,
        String currentResponsible, Boolean decommissioned, String notes) {
}
