const getUnixTime = () => {
    return Math.floor(Date.now() / 1000);
};

module.exports = {
    getUnixTime
};

