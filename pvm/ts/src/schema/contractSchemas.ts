import { model, Schema } from "mongoose";
import { IContractSchemaDocument } from "../models/interfaces";

const contractSchemasSchema = new Schema<IContractSchemaDocument>({
    category: {
        required: true,
        type: String,
    },
    name: {
        required: true,
        type: String,
    },
    schema: {
        required: true,
        type: Object,
    },
    hash: {
        required: true,
        type: String,
    },
});

export default model("ContractSchemas", contractSchemasSchema);