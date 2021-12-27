var express = require('express')
var router = express.Router()
var oracledb = require('oracledb')
var fs = require('fs')

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

router.get("/video", function (req, res) {
  // Ensure there is a range given for the video
  const range = req.headers.range
  // get video stats (about 61MB)
  const videoPath = "public/videos/102.mp4"
  const videoSize = fs.statSync("public/videos/102.mp4").size
  console.log(videoPath)
  console.log(videoSize)

  if (!range) {
    const head = {
        'Content-Length': videoSize,
        'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(videoPath).pipe(res)
  }else{
    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6 // 1MB
    const start = Number(range.replace(/\D/g, ""))
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1)

    // Create headers
    const contentLength = end - start + 1
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    }

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers)

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end })

    // Stream the video chunk to the client
    videoStream.pipe(res)
  }
});

module.exports = router