const userService = require("../src/service/userService");
const userDAO = require("../src/repository/userDAO");
const bcrypt = require("bcrypt");
const uuid = require("uuid");

// Mock dependencies
jest.mock("../src/repository/userDAO");
jest.mock("bcrypt");
jest.mock("uuid"); // Mock UUID

describe("User Service Tests", () =>{

    test("postUser should throw an error if username or password is too short", async () => {
        const user = { username: "abc", password: "123" };

        await expect(userService.postUser(user)).rejects.toThrow("Username and Password must be longer than 4 characters");
    });

    test("postUser should throw an error if username already exists", async () => {
        const user = { username: "existingUser", password: "securePass" };

        userDAO.getUserByUsername.mockResolvedValue(user); // Simulate existing user

        await expect(userService.postUser(user)).rejects.toThrow("Username already exists");
    });

    test("postUser should create a user successfully", async () => {
        const user = { username: "newUser", password: "securePass" };
        const hashedPassword = "hashedSecurePass";

        userDAO.getUserByUsername.mockResolvedValue(null); // No existing user
        bcrypt.hash.mockResolvedValue(hashedPassword); // Mock password hashing
        uuid.v4.mockReturnValue("mocked-uuid"); // Mock UUID generation

        userDAO.postUser.mockResolvedValue({ username: user.username, password: hashedPassword, user_id: "mocked-uuid", role_id: "Employee" });

        const result = await userService.postUser(user);

        expect(result).toEqual({
            username: "newUser",
            password: hashedPassword,
            user_id: "mocked-uuid",
            role_id: "Employee",
        });

        expect(userDAO.getUserByUsername).toHaveBeenCalledWith("newUser");
        expect(bcrypt.hash).toHaveBeenCalledWith("securePass", 10);
        expect(userDAO.postUser).toHaveBeenCalledWith({
            username: "newUser",
            password: hashedPassword,
            user_id: "mocked-uuid",
            role_id: "Employee",
        });
    });

    test("validateLogin should throw an error if username or password is missing", async () => {
        await expect(userService.validateLogin("", "password123")).rejects.toThrow("Username and password are required");
        await expect(userService.validateLogin("testUser", "")).rejects.toThrow("Username and password are required");
    });

    test("validateLogin should throw an error if username does not exist", async () => {
        userDAO.getUserByUsername.mockResolvedValue(null); // No user found

        await expect(userService.validateLogin("nonExistingUser", "password123")).rejects.toThrow("Invalid username or password");
    });

    test("validateLogin should throw an error if password is incorrect", async () => {
        const user = { username: "testUser", password: "hashedPassword123" };

        userDAO.getUserByUsername.mockResolvedValue(user);
        bcrypt.compare.mockResolvedValue(false); // Password does not match

        await expect(userService.validateLogin("testUser", "wrongPassword")).rejects.toThrow("Invalid username or password");
    });
    
    test("getUserByUsername should return user data", async () => {
        const mockUser = { username: "testUser", password: "hashedPassword123" };
        userDAO.getUserByUsername.mockResolvedValue(mockUser);

        const response = await userDAO.getUserByUsername("testUser");

        expect(response).toEqual(mockUser);
        expect(userDAO.getUserByUsername).toHaveBeenCalledWith("testUser");
    });

    test("validateLogin should return user if credentials are correct", async () => {
        const mockUser = { username: "testUser", password: "hashedPassword123" };
        userDAO.getUserByUsername.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true); // Simulate correct password

        const response = await userService.validateLogin("testUser", "password123");

        expect(response).toEqual(mockUser);
        expect(userDAO.getUserByUsername).toHaveBeenCalledWith("testUser");
        expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedPassword123");
    });
    
});