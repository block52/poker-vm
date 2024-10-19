package main

import (
	"fmt"
	"github.com/gofiber/fiber/v2"
)

type RPCRequest struct {
	ID     string        `json:"id"`
	Method string        `json:"method"`
	Params []interface{} `json:"params"`
}

type RPCResponse struct {
	ID     string      `json:"id"`
	Result interface{} `json:"result"`
	Error  interface{} `json:"error"`
}

func main() {
	fmt.Println("Hello, World!")

	app := fiber.New()

	app.Get("/", func(c *fiber.Ctx) error {

		response := RPCResponse{
			ID:     "1",
			Result: "Hello, World!",
			Error:  nil,
		}

		return c.Status(200).JSON(response)
	})

	// app.Post("/rpc", func(c *fiber.Ctx) error {
	// 	var req RPCRequest
	// 	if err := c.BodyParser(&req); err != nil {
	// 		return err
	// 	}

	// 	fmt.Println(req)
	// })

	app.Listen(":3000")
}
