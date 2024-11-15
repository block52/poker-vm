namespace pvm.models;

public class RPCResponse
{
    public string jsonrpc { get; set; }
    public object result { get; set; }
    public object error { get; set; }
    public string id { get; set; }
}
