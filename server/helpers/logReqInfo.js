
const logReqInfo = (req, res, next) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log('REQUEST*** ' + clientIP)

    console.log(Object.keys(req.query).map(key => `${key}: ${req.query[key]}`).join('\n'));

    next();
}

module.exports = {
    logReqInfo: logReqInfo
}