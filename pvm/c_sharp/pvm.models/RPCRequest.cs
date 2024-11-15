namespace pvm.models;

public class RPCRequest
{
    public string jsonrpc { get; set; }
    public string method { get; set; }
    public object[] @params { get; set; }
    public string id { get; set; }
}
