
const logReqInfo = (req, res, next) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log('REQUEST*** ' + {
        IPAddress: clientIP,
        ...req.query
    });

    next();
}

module.exports = {
    logReqInfo: logReqInfo
}