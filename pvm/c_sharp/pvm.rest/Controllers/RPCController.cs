using Microsoft.AspNetCore.Mvc;
using pvm.models;

namespace pvm.Controllers;

[ApiController]
[Route("[controller]")]
public class RPCController : ControllerBase
{
    private readonly ILogger<RPCController> _logger;

    public RPCController(ILogger<RPCController> logger)
    {
        _logger = logger;
    }

    [HttpPost(Name = "SendRPC")]
    public void Post()
    {
        var request = new RPCRequest
        {
            jsonrpc = "2.0",
            method = "getblockchaininfo",
            @params = new object[] { },
            id = "1"
        };

        using(var client = new HttpClient())
        {
            client.BaseAddress = new Uri("http://localhost:3000");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", "dXNlcjpwYXNz");
            var content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");
            var response = client.PostAsync("/", content).Result;
            var responseString = response.Content.ReadAsStringAsync().Result;
            
            Console.WriteLine(responseString);
        }
    }
}
