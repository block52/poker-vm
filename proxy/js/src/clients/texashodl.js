class TexasHodlClient extends Client {
    constructor() {
        super("texashodl", "Texas Hodl", "https://texashodl.com");
    }

    async fetch() {
        const response = await fetch("https://texashodl.com/api/v1/price");
        const json = await response.json();
        return json.price;
    }
}
