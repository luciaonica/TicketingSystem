const ticketService = require("../src/service/ticketService");
const ticketDAO = require("../src/repository/ticketDAO");
const uuid = require("uuid");

// Mock dependencies
jest.mock("../src/repository/ticketDAO");
jest.mock("uuid");

describe("ticketService", () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createTicket", () => {

        test("createTicket should throw an error if amount is negative", async () => {
            const ticket = { amount: -100, description: "Faulty request" };

            await expect(ticketService.createTicket(ticket)).rejects.toThrow("Amount cannot be negative");
        });

        test("createTicket should create a ticket successfully", async () => {
            const ticket = { amount: 200, description: "Reimbursement" };
            
            uuid.v4.mockReturnValue("mocked-ticket-id"); // Mock UUID
            ticketDAO.createTicket.mockResolvedValue({ ...ticket, ticket_id: "mocked-ticket-id", status: "Pending" });

            const result = await ticketService.createTicket(ticket);

            expect(result).toEqual({
                amount: 200,
                description: "Reimbursement",
                ticket_id: "mocked-ticket-id",
                status: "Pending",
            });

            expect(ticketDAO.createTicket).toHaveBeenCalledWith({
                amount: 200,
                description: "Reimbursement",
                ticket_id: "mocked-ticket-id",
                status: "Pending",
            });
        });

        test("should handle DAO errors", async () => {
            const mockTicket = { amount: 50, description: "Valid ticket", author: "user123" };
            const mockUUID = "mocked-uuid";
            const errorMessage = "DAO error";

            uuid.v4.mockReturnValue(mockUUID);
            ticketDAO.createTicket.mockRejectedValue(new Error(errorMessage));

            await expect(ticketService.createTicket(mockTicket))
                .rejects.toThrow(errorMessage);
        });    
    });

    describe("getPendingTickets", () => {

        test("should return pending tickets", async () => {
            const mockTickets = [
                { ticket_id: "1", status: "Pending", amount: 100 },
                { ticket_id: "2", status: "Pending", amount: 200 }
            ];

            ticketDAO.getTicketsByStatus.mockResolvedValue(mockTickets);

            const result = await ticketService.getPendingTickets();
            
            expect(result).toEqual(mockTickets);
            expect(ticketDAO.getTicketsByStatus).toHaveBeenCalledWith("Pending");
        });

        test("should handle errors when retrieving tickets", async () => {
            const errorMessage = "Database error";
            ticketDAO.getTicketsByStatus.mockRejectedValue(new Error(errorMessage));

            await expect(ticketService.getPendingTickets()).rejects.toThrow(errorMessage);
        });
    });

    describe("processTicket", () => {
        test("should process a ticket successfully", async () => {
            const ticket_id = "1";
            const resolver = "manager123";
            const status = "Approved";
            const mockTicket = { ticket_id, status: "Pending" };
            const updatedTicket = { ticket_id, status, resolver };

            ticketDAO.getTicketById.mockResolvedValue(mockTicket);
            ticketDAO.updateTicket.mockResolvedValue(updatedTicket);

            const result = await ticketService.processTicket(ticket_id, status, resolver);

            expect(result).toEqual(updatedTicket);
            expect(ticketDAO.getTicketById).toHaveBeenCalledWith(ticket_id);
            expect(ticketDAO.updateTicket).toHaveBeenCalledWith(ticket_id, status, resolver);
        });

        test("should throw an error if the ticket does not exist", async () => {
            const ticket_id = "999";
            ticketDAO.getTicketById.mockResolvedValue(null);

            await expect(ticketService.processTicket(ticket_id, "Approved", "resolver123"))
                .rejects.toThrow("Ticket not found");

        });

        test("should throw an error if the ticket is already processed", async () => {
            const ticket_id = "1";
            const mockTicket = { ticket_id, status: "Approved" };

            ticketDAO.getTicketById.mockResolvedValue(mockTicket);

            await expect(ticketService.processTicket(ticket_id, "Approved", "resolver123"))
                .rejects.toThrow("Ticket already processed");

        });

        test("should handle DAO errors", async () => {
            const ticket_id = "1";
            const errorMessage = "Database error";

            ticketDAO.getTicketById.mockRejectedValue(new Error(errorMessage));

            await expect(ticketService.processTicket(ticket_id, "Approved", "resolver123"))
                .rejects.toThrow(errorMessage);

        });
    });

    describe("getAllTickets", () => {
    
        afterEach(() => {
            jest.clearAllMocks();
        });
    
        test("should return all tickets when user is a Manager", async () => {
            const mockTickets = [
                { ticket_id: "1", author: "user1", status: "Pending" },
                { ticket_id: "2", author: "user2", status: "Approved" }
            ];
            const user = { role_id: "Manager", user_id: "manager1" };
    
            ticketDAO.getAllTickets.mockResolvedValue(mockTickets);
    
            const result = await ticketService.getAllTickets(user);
            
            expect(result).toEqual(mockTickets);
            expect(ticketDAO.getAllTickets).toHaveBeenCalledTimes(1);
            expect(ticketDAO.getTicketsByEmployee).not.toHaveBeenCalled();
        });
    
        test("should return tickets for a specific employee", async () => {
            const mockTickets = [
                { ticket_id: "3", author: "employee1", status: "Pending" }
            ];
            const user = { role_id: "Employee", user_id: "employee1" };
    
            ticketDAO.getTicketsByEmployee.mockResolvedValue(mockTickets);
    
            const result = await ticketService.getAllTickets(user);
            
            expect(result).toEqual(mockTickets);
            expect(ticketDAO.getTicketsByEmployee).toHaveBeenCalledWith(user.user_id);
            expect(ticketDAO.getTicketsByEmployee).toHaveBeenCalledTimes(1);
            expect(ticketDAO.getAllTickets).not.toHaveBeenCalled();
        });
    
        test("should throw an error if ticket retrieval fails", async () => {
            const user = { role_id: "Manager", user_id: "manager1" };
    
            ticketDAO.getAllTickets.mockRejectedValue(new Error("Database Error"));
    
            await expect(ticketService.getAllTickets(user)).rejects.toThrow("Database Error");
    
            expect(ticketDAO.getAllTickets).toHaveBeenCalledTimes(1);
        });
    });

});