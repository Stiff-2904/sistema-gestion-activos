package cr.go.ctposa.assetmanagement.dto.asset;

import java.time.LocalDateTime;

public record AssetAuditResponse(
        Integer id, String action, String user, LocalDateTime dateTime, String details) {
}
