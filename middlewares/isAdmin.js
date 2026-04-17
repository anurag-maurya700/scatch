module.exports = function (req, res, next) {

    if (!req.user || req.user.role !== "admin") {
        return res.send("🚫 Not Authorized");
    }

    next();
};