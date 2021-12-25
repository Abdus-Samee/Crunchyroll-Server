var express = require('express')
var router = express.Router()
var oracledb = require('oracledb')

//to connect to64-bit oracle client --> gives error if not connected
if (process.platform === 'win32') {
  try {
    oracledb.initOracleClient({libDir: 'E:\\instantclient-basic-windows.x64-21.3.0.0.0\\instantclient_21_3'})   // note the double backslashes
  } catch (err) {
    console.error('Whoops!')
    console.error(err)
    process.exit(1)
  }
}

router.get('/', (req, res, next) => {
    oracledb.getConnection({
        user: "hr",
        password: "hr",
        connectString: "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA =(SID= ORCL)))"
    }, (err, con) => {
        if(err){
            console.log('Cannot connect...')
            console.log(err)
            res.send(err)
        }
        else{
            var q = 'select * from anime'

            binds = {}

            // For a complete list of options see the documentation.
            options = {
                outFormat: oracledb.OUT_FORMAT_OBJECT, // query result format
            }

            con.execute(q, binds, options, (e, a) => {
                if(e) res.send(e)
                else{
                    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                    res.send(a.rows)
                }
            })
        }
    })
})

module.exports = router