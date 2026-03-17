module.exports = {
  isEmail: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  isStrongPassword: (password) => {
    return password.length >= 6;
  }
};
