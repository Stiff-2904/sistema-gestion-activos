package cr.go.ctposa.assetmanagement.controller;

import cr.go.ctposa.assetmanagement.dto.user.DeleteUserPreviewResponse;
import cr.go.ctposa.assetmanagement.dto.user.DeleteUserResponse;
import cr.go.ctposa.assetmanagement.exception.GlobalExceptionHandler;
import cr.go.ctposa.assetmanagement.exception.UserDeletionConflictException;
import cr.go.ctposa.assetmanagement.service.UserService;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserDeletionControllerTest {
    @Test
    void deletionEndpointsRequireSuperuser() throws Exception {
        Method preview = UserController.class.getMethod("getDeletionPreview", Integer.class);
        assertArrayEquals(new String[] {"/{id}/deletion"}, preview.getAnnotation(GetMapping.class).value());
        assertEquals("hasRole('SUPERUSER')", preview.getAnnotation(PreAuthorize.class).value());
        Method delete = UserController.class.getMethod("deleteUser", Integer.class);
        assertArrayEquals(new String[] {"/{id}"}, delete.getAnnotation(DeleteMapping.class).value());
        assertEquals("hasRole('SUPERUSER')", delete.getAnnotation(PreAuthorize.class).value());
    }

    @Test
    void deletionAndPreviewReturnExpectedResponses() {
        UserService service = mock(UserService.class);
        var preview = new DeleteUserPreviewResponse(2, "Ana", "ana@ctposa.ac.cr", "BASIC_USER", false, true, "Permitido");
        var deleted = new DeleteUserResponse(2, "Eliminado");
        when(service.getDeletionPreview(2)).thenReturn(preview);
        when(service.deleteUser(2)).thenReturn(deleted);
        var controller = new UserController(service);
        assertSame(preview, controller.getDeletionPreview(2).getBody());
        var result = controller.deleteUser(2);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertSame(deleted, result.getBody());
    }

    @Test
    void deletionConflictsReturn409() {
        var result = new GlobalExceptionHandler().handleDeletionConflict(
                new UserDeletionConflictException("Usuario con actividad histórica"));
        assertEquals(HttpStatus.CONFLICT, result.getStatusCode());
        assertEquals("Usuario con actividad histórica", result.getBody().get("message"));
    }
}
