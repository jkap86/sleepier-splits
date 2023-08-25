
const logReqInfo = (req, res, next) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log({
        IPAddress: clientIP,
        ...req.query
    });

    next();
}

module.exports = {
    logReqInfo: logReqInfo
}