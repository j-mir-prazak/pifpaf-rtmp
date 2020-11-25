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
		"pipeFrom":null,
		"pipeTo":null,
		"port":null,
		"address":"0.0.0.0",
		"bufferInput":null,
		"bufferOutput":null,
		"readable":null

	}

	//socket tcp to ffmpeg server
	pair.middle = {

	  "socket":null,
	  "server":null,
	  "connection":null,
		"pipeFrom":null,
		"pipeTo":null,
		"port":null,
		"address":"127.0.0.1",
		"bufferInput":null,
		"bufferOutput":null,
		"readable":null

	}

	pair.ffmpeg = {

		"process":null,
		"connection":null,
		"pipeFrom":null,
		"pipeTo":null,
		"port":null,
		"address":"127.0.0.1",
		"bufferInput":null,
		"bufferOutput":null,
		"readable":null

	}


	//socket tcp/tls to ouside (ffmpeg pipe)
	pair.output = {

	  "socket":null,
	  "server":null,
	  "connection":null,
		"pipeFrom":null,
		"pipeTo":null,
		"port":null,
		"address":"0.0.0.0",
		"bufferInput":null,
		"bufferOutput":null,
		"readable":null

	}

	console.log("setting input port: " + inputPort)
	pair.input.port = inputPort
	console.log("setting middle port and ffmpeg port: " + middlePort)
	pair.middle.port = middlePort
	pair.ffmpeg.port = middlePort
	console.log("setting output port: " + outputPort)
	pair.output.port = outputPort

	pair.input.server = inputServer( pair )

	pair.middle.socket = new net.Socket()

	pair.output.server = outputServer ( pair )

	pair.ffmpeg.process = ffmpegServer ( pair)



	return pair

}

var pair = setup( "8000", "8001", "8002" )




















function ffmpeg( port, address ) {

	console.log("setting ffmpeg on: " + address + ":" + port)

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





function ffmpegServer ( object ) {

	var holder = object || false

	function readableEventHandler() {
		var data = server.stdout.read()
		console.log(data)

	}

	function readableErrEventHandler() {
		var data = server.stderr.read()
		if ( data ) console.log(decoder.write(data))

	}

	function exitEventHandler(e) {

		console.log("ffmpeg exit: " + e)

	}

	var server = ffmpeg( holder.ffmpeg.port , holder.ffmpeg.address )
	server.stdout.on("readable", readableEventHandler)
	server.on("exit", exitEventHandler)
	server.stderr.on("readable", readableErrEventHandler)

	return server

}



function middleSocket ( object ) {

	var holder = object || false

	if ( ! holder ) return false

	function connectionEventHandler() {

		console.log("middle socket connected")
		holder.middle.connection = true
		if ( holder.middle.pipeFrom ) return false
		holder.middle.pipeFrom = holder.input
		inputToMiddlePipe( holder )

	}



	function readableEventHandler() {

		console.log("middle socket readable")
		middleToInputPipe( holder )



	}

	function endEventHandle() {

		console.log("middle socket ended")
		holder.middle.connection = null

	}

	holder.middle.socket.on( "connect", connectionEventHandler )
	holder.middle.socket.on( "readable", readableEventHandler )
	holder.middle.socket.on( "end", endEventHandle )


	holder.middle.socket.connect(
			{

			"host":holder.ffmpeg.address,
			"port":holder.ffmpeg.port

			}
	)

	return true
}


function inputToMiddle( object ) {

	var holder = object || false
	if ( holder.input.socket && holder.ffmpeg.process ) {
		middleSocket( holder )

	}

}












function inputToMiddlePipe( object ) {

	console.log("crosspiping input to middle")

	var holder = object || false


	holder.input.socket.pipe(holder.middle.socket)
	holder.input.socket.resume()


}









function middleToInputPipe( object ) {

	console.log("crosspiping middle to input")

	var holder = object || false


	holder.middle.socket.pipe(holder.input.socket)
	holder.middle.socket.resume()


}



















crossPipe( object, child ) {

	var holder = object || false
	var child = child || false






}







function inputSocket ( object ) {

	var holder = object || false

	function readableEventHandler() {

		// console.log(holder.input.socket)
		// holder.input.socket.read()
		// console.log("input server readable")
		crossPipe( holder, holder.input )


		//holding first messages
		// holder.input.bufferInput = holder.input.socket.read()

	}

	//cleaning on end
	function endEventHandler() {

		console.log("cleaning input socket")
		holder.input.socket = null
		holder.input.readable = null


	}

	holder.input.socket.on("end", endEventHandler)
	holder.input.socket.on("readable", readableEventHandler)



}










function inputServer ( object ) {

	var holder = object || false

	function connectionEventHandle(s) {

		console.log("input connection on: " + holder.input.port )

		var socket = s || false

		// console.log(holder.input.socket)

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

	function readableEventHandler(d) {

		console.log("output connection on: " + holder.output.port )

	}

	//cleaning on end
	function endEventHandler(d) {


		console.log("cleaning output socket")
		holder.output.socket = null


	}

	holder.output.socket.on("readable", readableEventHandler)
	holder.output.socket.on("end", endEventHandler)

}




function outputServer ( object ) {

	var holder = object || false


	function connectionEventHandle(s) {

		console.log("output connection on: " + holder.input.port )

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
