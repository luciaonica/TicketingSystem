const ticketService = require("../src/service/ticketService");
const ticketDAO = require("../src/repository/ticketDAO");
const uuid = require("uuid");

// Mock dependencies
jest.mock("../src/repository/ticketDAO");
jest.mock("uuid"); // Mock UUID

describe("Ticket Service Tests", () => {

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
});