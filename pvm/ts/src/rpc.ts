import { Mint } from "./commands";
import { ICommand } from "./commands/interfaces";
import { RPCRequest, RPCResponse } from "./types/rpc";

export class RPC {
    static async handle(request: RPCRequest): Promise<RPCResponse> {

        const id = request.id;

        const response: RPCResponse = {
            id,
        };

        let command: ICommand;

        // switch (request.method) {
        //     case "mint":
        //         if (!request.params || request.params.length !== 3) {
        //             response.error = "Invalid params";
        //         }

        //         const to: string = request.params[0];
        //         command = new Mint(request.params[0], params[1], params[2]);

        //         break;
        //     case "sayHello":
        //         response.result = "Hello!";
        //         break;
        //     default:
        //         response.error = "Method not found";
        // }

        // response.result = await command.execute();
        return response;
    }
}