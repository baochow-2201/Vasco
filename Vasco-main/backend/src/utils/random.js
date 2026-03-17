const { v4: uuidv4 } = require("uuid");

module.exports = {
  randomCode: (length = 6) => {
    let result = "";
    const chars = "0123456789";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  uuid: () => uuidv4()
};
