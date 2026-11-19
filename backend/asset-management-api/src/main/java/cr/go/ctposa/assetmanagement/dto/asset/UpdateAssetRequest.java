package cr.go.ctposa.assetmanagement.dto.asset;

/** HU-GA-03: los datos editables conservan las reglas de validacion de registro.
 * No permite actualizar ID, fecha, ni indicador de baja mediante PUT.
 */
public class UpdateAssetRequest extends CreateAssetRequest {
    public UpdateAssetRequest() {
        super();
    }
}
