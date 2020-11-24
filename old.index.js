var tls = require('tls'),
		fs = require('fs'),
		net = require('net'),
    spawn = require('child_process'),
		string_decoder = require('string_decoder')

var decoder = new string_decoder.StringDecoder('utf8');

var cert = {

	key: fs.readFileSync('client-private-key.pem'),
	cert: fs.readFileSync('client-certificate.pem'),
	allowHalfOpen: true

}


var pair = {

	"input":null,
	"middle":null,
	"output":null,
	"ffmpeg":null

}

//socket outside to tls
pair.input = {

  "socket":null,
  "server":null,
  "connection":null,
	"pipeFrom":new Array(),
	"pipeTo":new Array(),
	"port":null,
	"address":null,
	"bufferInput":null,
	"bufferOutput":null

}

//socket tcp to ffmpeg server
pair.middle = {

  "socket":null,
  "server":null,
  "connection":null,
	"pipeFrom":new Array(),
	"pipeTo":new Array(),
	"port":null,
	"address":null,
	"bufferInput":null,
	"bufferOutput":null

}

pair.ffmpeg = {

	"process":null,
	"connection":null,
	"pipeFrom":new Array(),
	"pipeTo":new Array(),
	"port":null,
	"address":null,
	"bufferInput":null,
	"bufferOutput":null

}


//socket tcp/tls to ouside (ffmpeg pipe)
pair.output = {

  "socket":null,
  "server":null,
  "connection":null,
	"pipeFrom":new Array(),
	"pipeTo":new Array(),
	"port":null,
	"address":null,
	"bufferInput":null,
	"bufferOutput":null

}




function ffmpegServer( address, port ) {

	var address = address || false
	var port = port || false

	if ( port == false || address == false ) return false

	var command = "ffmpeg";

	var args = [
		"-loglevel",
		"verbose",
		"-listen",
		"1",
		"-i",
		"rtmp://" + address + ":" + port,
		"-c",
		"copy",
		"-f",
		"mpegts",
		"-"
	]

	var options = [];

	var ffmpeg = spawn.spawn(

		command,
		args,
		options

	)

	return ffmpeg

}

var ffmpeg = ffmpegServer( "127.0.0.1", "8001" )


ffmpeg.stdout.on("readable", () => {

	console.log("readable")
	// ffmpeg.stdout.read()
	// console.log("stderr: " + decoder.write(ffmpeg.stdout.read()))

})

ffmpeg.stderr.on("data", (e) => {

	console.log("stderr: " + decoder.write(e))

})

ffmpeg.stdout.on("data", (e) => {

	// console.log("stdout: " + decoder.write(e))
	// ffmpeg.stdout.pause()

})

ffmpeg.on("exit", (e) => {

	console.log("ffmpeg end " + e)

})

ffmpeg.on("error", (e) => {

	console.log("ffmpeg error " + e)

})







var certified = tls.createServer(cert, function (socket) {

  console.log("tls connection")

	pair.input.socket = socket

	pair.input.socket.once("readable", () => {

		console.log("tls readable")

    //connecting to rtmp server instance

		var middle = new net.Socket()

		var socket_middle = middle.connect({

			"host":"localhost",
			"port":"8001"

		}, (s) => {


			console.log("tcp connection")

			pair.middle.socket.write(pair.input.socket.read())
			pair.input.socket.pipe(pair.middle.socket)

		})

		pair.middle.socket = socket_middle

		pair.middle.socket.once("readable", () => {

			// pair.middle.resume()
			console.log("tcp readable")

			// pair.middle.socket.write(pair.input.socket.read())
			//
			// var data = pair.middle.socket.read();
			// pair.input.socket.write(data)

			// console.log(data)

			var data = pair.middle.socket.read()
			console.log(data)

			pair.input.socket.write( data )
			pair.middle.socket.pipe( pair.input.socket )

		})

		pair.middle.socket.on("connect", () => {

			// console.log("connect")
			// socket.resume()
			// socket.pipe(pair.middle)

		})

	})


	pair.input.socket.on("lookup", (e) => {


  })

	pair.input.socket.on("close", (e) => {


  })

	pair.input.socket.on("error", (e) => {


  })

	pair.input.socket.on("end", (e) => {

		// pair.input.unpipe(pair.middle)

		pair.input.socket = null

		console.log("tls end")

	})


}).listen(8000, "0.0.0.0");
