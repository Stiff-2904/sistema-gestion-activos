package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.user.CreateUserResponse;
import cr.go.ctposa.assetmanagement.dto.user.UpdateUserRoleRequest;
import cr.go.ctposa.assetmanagement.exception.GlobalExceptionHandler;
import cr.go.ctposa.assetmanagement.service.UserService;
import java.lang.reflect.Method;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserRoleControllerTest {

    // CA01: el endpoint responde 200 con el usuario y su nuevo rol
    @Test
    void updateUserRole_ValidRequest_ReturnsHttp200() {
        UserService service = mock(UserService.class);
        UpdateUserRoleRequest request = new UpdateUserRoleRequest();
        request.setRole("INTERMEDIATE_USER");
        CreateUserResponse expected = new CreateUserResponse(
                2, "Ana", "ana@ctposa.ac.cr", "INTERMEDIATE_USER", true);
        when(service.updateUserRole(2, request)).thenReturn(expected);

        ResponseEntity<CreateUserResponse> result = new UserController(service).updateUserRole(2, request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertSame(expected, result.getBody());
        verify(service, times(1)).updateUserRole(2, request);
    }

    @Test
    void updateUserRole_EndpointIsPatchAndRequiresSuperuserRole() throws Exception {
        Method method = UserController.class.getMethod(
                "updateUserRole", Integer.class, UpdateUserRoleRequest.class);

        PatchMapping mapping = method.getAnnotation(PatchMapping.class);
        assertNotNull(mapping);
        assertArrayEquals(new String[] {"/{id}/role"}, mapping.value());

        PreAuthorize security = method.getAnnotation(PreAuthorize.class);
        assertNotNull(security);
        assertEquals("hasRole('SUPERUSER')", security.value());
    }

    // CA04: el rechazo del servicio se convierte en 400 con el mensaje de la regla
    @Test
    void updateUserRole_LastSuperuserRejected_ReturnsHttp400WithMessage() {
        String message = "No se puede cambiar el rol: el sistema debe conservar al menos un superusuario activo";

        ResponseEntity<Map<String, Object>> result = new GlobalExceptionHandler()
                .handleIllegalArgument(new IllegalArgumentException(message));

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertEquals(message, result.getBody().get("message"));
    }
}
