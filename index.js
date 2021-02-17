let express = require('express');
let app = express();

let adminApi = require('./adminApi2.js')

//allow custom header and CORS
app.all('*',function (req, res, next) {
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
   res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
   if (req.method == 'OPTIONS') {
      // /让options请求快速返回/
      res.send(200);
   } else {
      next();
   }
});


app.use('/admin', adminApi)

let server = app.listen(8081, () => {
    let host = server.address().address;
    let port = server.address().port;
    console.log("http://localhost", host, port)
});
