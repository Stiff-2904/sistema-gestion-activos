package cr.go.ctposa.assetmanagement.dto.asset;

import java.util.List;

/** Opciones que el formulario de registro muestra en sus listas desplegables. */
public record AssetCatalogResponse(
        List<CatalogItemResponse> statuses,
        List<CatalogItemResponse> locations,
        List<CatalogItemResponse> categories,
        List<CatalogItemResponse> acquisitionModes,
        List<CatalogItemResponse> responsibles) {
}
