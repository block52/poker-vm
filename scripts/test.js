const axios = require("axios");

const mint = async () => {
  try {
    const response = await axios.post("http://localhost:3000", {
      method: "mint",
      params: ["0x1234567890abcdef"],
      id: 1,
    });

    console.log(response.data);
  } catch (e) {
    console.error(e);
  }
};
