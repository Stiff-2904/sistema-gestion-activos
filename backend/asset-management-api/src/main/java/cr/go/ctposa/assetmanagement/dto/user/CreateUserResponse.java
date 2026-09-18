package cr.go.ctposa.assetmanagement.dto.user;

public class CreateUserResponse {

    private Integer id;
    private String name;
    private String email;
    private String role;
    private Boolean active;

    public CreateUserResponse(
            Integer id,
            String name,
            String email,
            String role,
            Boolean active) {

        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.active = active;
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public Boolean getActive() {
        return active;
    }
}