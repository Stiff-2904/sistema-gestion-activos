package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.user.CreateUserResponse;
import cr.go.ctposa.assetmanagement.dto.user.UpdateUserStatusRequest;
import cr.go.ctposa.assetmanagement.service.UserService;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserStatusControllerTest {
    @Test
    void statusEndpointRequiresSuperuserAndPatch() throws Exception {
        Method method = UserController.class.getMethod("updateUserStatus", Integer.class, UpdateUserStatusRequest.class);
        assertArrayEquals(new String[] {"/{id}/status"}, method.getAnnotation(PatchMapping.class).value());
        assertEquals("hasRole('SUPERUSER')", method.getAnnotation(PreAuthorize.class).value());
        Method get = UserController.class.getMethod("getUserStatus", Integer.class);
        assertArrayEquals(new String[] {"/{id}/status"}, get.getAnnotation(GetMapping.class).value());
        assertEquals("hasRole('SUPERUSER')", get.getAnnotation(PreAuthorize.class).value());
    }
    @Test
    void patchReturns200WithNewState() {
        UserService service = mock(UserService.class);
        UpdateUserStatusRequest req = new UpdateUserStatusRequest();
        req.setActive(false);
        req.setReason("Autorizado");
        CreateUserResponse result = new CreateUserResponse(2, "Ana", "ana@ctposa.ac.cr", "BASIC_USER", false);
        when(service.updateUserStatus(2, req)).thenReturn(result);
        var response = new UserController(service).updateUserStatus(2, req);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(result, response.getBody());
    }
}
