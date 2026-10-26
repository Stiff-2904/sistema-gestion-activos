package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.user.CreateUserRequest;
import cr.go.ctposa.assetmanagement.dto.user.CreateUserResponse;
import cr.go.ctposa.assetmanagement.dto.user.UpdateUserRequest;
import cr.go.ctposa.assetmanagement.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import java.lang.reflect.Method;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserControllerTest {

    @Test
    void createUser_ValidRequest_ReturnsHttp201() {
        UserService service = mock(UserService.class);
        CreateUserRequest request = new CreateUserRequest();
        CreateUserResponse expected = new CreateUserResponse(
                2, "Ana", "ana@ctposa.ac.cr", "BASIC_USER", true);
        when(service.createUser(request)).thenReturn(expected);

        ResponseEntity<CreateUserResponse> result = new UserController(service).createUser(request);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertSame(expected, result.getBody());
        verify(service).createUser(request);
    }

    @Test
    void createUser_EndpointRequiresSuperuserRole() throws Exception {
        Method method = UserController.class.getMethod("createUser", CreateUserRequest.class);
        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);
        assertNotNull(preAuthorize);
        assertEquals("hasRole('SUPERUSER')", preAuthorize.value());
        // Verifica la configuración declarada, no reemplaza una prueba HTTP de seguridad.
    }
    @Test
    void updateUser_Returns200_AndRequiresSuperuserRole() throws Exception {
        UserService service = mock(UserService.class);
        UpdateUserRequest request = new UpdateUserRequest();
        CreateUserResponse expected = new CreateUserResponse(2,"Ana","ana@ctposa.ac.cr","BASIC_USER",true);
        when(service.updateUser(2,request)).thenReturn(expected);
        ResponseEntity<CreateUserResponse> response = new UserController(service).updateUser(2,request);
        assertEquals(HttpStatus.OK,response.getStatusCode());
        assertSame(expected,response.getBody());
        Method method = UserController.class.getMethod("updateUser",Integer.class,UpdateUserRequest.class);
        PreAuthorize security = method.getAnnotation(PreAuthorize.class);
        assertNotNull(security);
        assertEquals("hasRole('SUPERUSER')",security.value());
    }
}
