var tls = require('tls'),
		fs = require('fs'),
		net = require('net'),
    spawn = require('child_process'),
		string_decoder = require('string_decoder')

var decoder = new string_decoder.StringDecoder('utf8');

var cert = {

	key: fs.readFileSync('client-private-key.pem'),
	cert: fs.readFileSync('client-certificate.pem')
	// allowHalfOpen: true

}

//
//
// function ffmpegServer( address, port ) {
//
// 	var address = address || false
// 	var port = port || false
//
// 	if ( port == false || address == false ) return false
//
// 	var command = "ffmpeg";
// 	var args = [
// 		"-loglevel",
// 		"verbose",
// 		"-listen",
// 		"1",
// 		"-i",
// 		"rtmp://" + address + ":" + port,
// 		"-c",
// 		"copy",
// 		"-f",
// 		"mpegts",
// 		"-"
// 	]
// 	var options = [];
//
// 	var ffmpeg = spawn.spawn(
//
// 		command,
// 		args,
// 		options
//
// 	)
//
// 	return ffmpeg
//
// }
//
// var ffmpeg = ffmpegServer( "127.0.0.1", "8001" )
//
//
// ffmpeg.stdout.on("readable", () => {
//
// 	console.log("readable")
// 	// ffmpeg.stdout.read()
// 	// console.log("stderr: " + decoder.write(ffmpeg.stdout.read()))
//
// })
//
// ffmpeg.stderr.on("data", (e) => {
//
// 	console.log("stderr: " + decoder.write(e))
//
// })
//
// ffmpeg.stdout.on("data", (e) => {
//
// 	// console.log("stdout: " + decoder.write(e))
// 	// ffmpeg.stdout.pause()
//
// })
//
// ffmpeg.on("exit", (e) => {
//
// 	console.log("ffmpeg end " + e)
//
// })
//
// ffmpeg.on("error", (e) => {
//
// 	console.log("ffmpeg error " + e)
//
// })
//





//
// var middle = new net.Socket()
// pair.middle.socket = middle
//






function setup(inputPort, middlePort, outputPort) {

	var inputPort = inputPort || false
	var middlePort = middlePort || false
	var outputPort = outputPort || false

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
		"address":"0.0.0.0",
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
		"address":"127.0.0.1",
		"bufferInput":null,
		"bufferOutput":null

	}

	pair.ffmpeg = {

		"process":null,
		"connection":null,
		"pipeFrom":new Array(),
		"pipeTo":new Array(),
		"port":null,
		"address":"127.0.0.1",
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
		"address":"0.0.0.0",
		"bufferInput":null,
		"bufferOutput":null

	}

	console.log("setting input port: " + inputPort)
	pair.input.port = inputPort
	console.log("setting middle port: " + middlePort)
	pair.middle.port = middlePort
	console.log("setting output port: " + outputPort)
	pair.output.port = outputPort

	pair.input.server = inputServer( pair )

	pair.output.server = outputServer ( pair )



	return pair

}

var pair = setup( "8000", "8001", "8002" )




function inputSocket ( object ) {

	var holder = object || false

	function dataEventHandler(d) {

		console.log(d)

	}

	holder.input.socket.on("data", dataEventHandler)



}


function inputServer ( object ) {

	var holder = object || false

	function connectionEventHandle(s) {


		console.log("input connection")

		var socket = s || false

		if ( ! socket || holder.input.socket ) {

			console.log("input connection denied")

			if ( socket ) socket.end()

			return false

		}

		holder.input.socket = socket
		inputSocket(holder)



	}

	var server = tls.createServer( cert )
	server.listen( holder.input.port, holder.input.address )
	server.on("secureConnection", connectionEventHandle)

	return server

}



function outputSocket ( object ) {

	var holder = object || false

	function dataEventHandler(d) {

		console.log(d)

	}

	holder.output.socket.on("data", dataEventHandler)

}




function outputServer ( object ) {

	var holder = object || false


	function connectionEventHandle(s) {

		console.log("output connection")

		var socket = s || false

		if ( ! socket || holder.output.socket ) {

			console.log("output connection denied")
			if ( socket ) socket.end()

			return false

		}

		holder.output.socket = socket
		outputSocket(holder)

	}

	var server = net.createServer()
	server.listen( holder.output.port, holder.output.address )
	server.on("connection", connectionEventHandle)

	return server

}










function connectHandle(socket) {
		socket.on("data", (e) => {
			console.log(e)
		})


		function readableEventHandle(d) {

			console.log(d)

		}





	socket.on("data", readableEventHandle)
	socket.resume()

		console.log(socket.readyState)


	// console.log(socket.address())







	// console.log(socket)


	// pair.input.socket.once("readable", () => {
	//
	// 	console.log("tls readable")
	//
  //   //connecting to rtmp server instance
	//
	//
	//
	// 	pair.middle.socket.connect({
	//
	// 		"host":"localhost",
	// 		"port":"8001"
	//
	// 	}, (s) => {
	//
	// 		console.log("tcp connection")
	// 		pair.middle.socket.write(pair.input.socket.read())
	//
	// 		pair.input.socket.pipe(pair.middle.socket)
	//
	// 	})
	//
	//
	//
	// 	pair.middle.socket.once("readable", () => {
	//
	// 		console.log("tcp readable")
	// 		var data = pair.middle.socket.read()
	// 		console.log(data)
	//
	// 		pair.input.socket.write( data )
	//
	// 		pair.middle.socket.pipe(pair.input.socket)
	//
	//
	//
	// 	})
	//
	// 	pair.middle.socket.on("connect", () => {
	//
	//
	// 	})
	//
	// })


	socket.on("lookup", (e) => {


  })

	socket.on("close", (e) => {


  })

	socket.on("error", (e) => {


  })

	socket.on("end", (e) => {
		console.log("end")

	})


}

var certified = new tls.Server(cert)
certified.on("secureConnection", connectHandle)
certified.listen(8009, "0.0.0.0")
// console.log(certified)
