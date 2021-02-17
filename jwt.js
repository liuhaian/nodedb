const config = require('./config.json');
const jwt = require('jsonwebtoken');

module.exports = {
    generateAccessToken,
    authenticateToken
};

function generateAccessToken(account) {
  // expires after half and hour (1800 seconds = 30 minutes)
  return jwt.sign(account, config.secret, { expiresIn: 1800 });
}

function authenticateToken(req, res, next) {
  // Gather the jwt access token from the request header
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401) // if there isn't any token

  jwt.verify(token, config.secret, (err, account) => {
    console.log("token err:"+err)
    if (err) return res.sendStatus(403)
    req.accInToken = account
    // console.log(JSON.stringify(account))
    next() // pass the execution off to whatever request the client intended
  })
}
