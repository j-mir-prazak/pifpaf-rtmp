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
		"readable":null,
		"helper":{
			"readable":null
		}

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
		"readable":null,
		"helper":{
					"readable":null
				}

	}

	pair.ffmpeg = {

		"process":null,
		"connection":null,
		"pipeFrom":null,
		"pipeTo":new Array(),
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

		if (holder.ffmpeg.pipeTo.length > 0) {
		holder.ffmpeg.pipeTo.forEach((item, i) => {

			if ( item.writable && data) item.write(data)


			});
		}



	}

	function readableErrEventHandler() {
		var data = server.stderr.read()
		// if ( data ) console.log(decoder.write(data))

	}

	function exitEventHandler(e) {

		console.log("ffmpeg exit: " + e)


		if (holder.input.socket) {

			holder.input.socket.end()
			// holder.input.socket.destroy()

		}

		if (holder.middle.socket) {

			// console.log("ffmpeg would kill middle")

			holder.middle.socket.end()
			// holder.middle.socket.destroy()

		}

		holder.ffmpeg.process = ffmpegServer( holder )

	}

	function errorEventHandler(e){

		console.log("ffmpeg error: " + e)

	}

	var server = ffmpeg( holder.ffmpeg.port , holder.ffmpeg.address )
	server.stdout.on("readable", readableEventHandler)
	server.on("exit", exitEventHandler)
	server.on("error", errorEventHandler)
	server.stderr.on("readable", readableErrEventHandler)

	return server

}



function middleSocket ( object ) {

	// console.log(object.ffmpeg)

	var holder = object || false

	if ( ! holder ) return false

	holder.middle.socket = new net.Socket()

	function connectionEventHandler() {

		console.log("middle socket connected")
		inputToMiddlePipe( holder, true )
		holder.middle.connection = true

	}


	function readableEventHandler() {

		console.log("middle socket readable")
		holder.middle.socket.removeListener("readable",readableEventHandler)
		middleToInputPipe( holder, true )

	}


	function endEventHandler() {


		console.log("middle socket ended")
		middleToInputPipe( holder, false )
		holder.middle.connection = null
		// holder.middle.helper.readable = null

	}


	function closeEventHandler() {


		console.log("middle socket close")
		middleToInputPipe( holder, false )
		holder.middle.connection = null
		// holder.middle.helper.readable = null

		holder.middle.socket = null


	}


	function errorEventHandler(e) {

		console.log("middle socket error: "+e)

	}

	holder.middle.socket.on( "connect", connectionEventHandler )
	holder.middle.socket.on( "end", endEventHandler )
	holder.middle.socket.on( "close", closeEventHandler )
	holder.middle.socket.on( "readable", readableEventHandler )
	holder.middle.socket.on( "error", errorEventHandler )


	holder.middle.socket.connect (
			{

			"host":holder.ffmpeg.address,
			"port":holder.ffmpeg.port

			}
	)

	return true
}


function inputToMiddle( object ) {

	console.log("connecting")
	var holder = object || false

	if ( holder.input.socket && holder.ffmpeg.process ) {

		middleSocket( holder )

	}

}









function inputToMiddlePipe( object, pipe ) {

	var holder = object || false
	var pipe = pipe

	// console.log(  holder.input.socket._events  )

	function pipeHandler() {

		var data = holder.input.socket.read()

		if ( data != null ) {

			// console.log("input readable")
			if (holder.middle.socket) {

				// console.log(data)
				holder.middle.socket.write(data)

				}

		}


	}

	if ( pipe == true ) {


		console.log("crosspiping input to middle")
		// console.log(  holder.input.socket._events  )
		// holder.input.socket.pipe(holder.middle.socket)


		holder.input.socket.on("readable", pipeHandler)

		holder.input.helper.readable = pipeHandler

	}

	else if ( pipe == false ) {

		console.log("unping input to middle")

		if ( holder.input.helper.readable ) {

			holder.input.socket.removeListener( "readable", holder.input.helper.readable )
			holder.input.helper.readable = null


			// holder.input.socket.read().length

			// while ( holder.input.socket.readable ) {
			//
			// 	console.log("flushing input")
			// 	var data = holder.input.socket.read()
			// 	holder.middle.socket.write(data)
			//
			//
			// }

		}

	}


	// console.log (  holder.input.socket._events  )


}





function inputToMiddleUnpipe( object ) {


	console.log("unping input to middle")

	var holder = object || false

	console.log(holder.input.socket._events)

	console.log( holder.input.helper.readable.length )

	var readable = holder.input.helper.readable.pop()

	while ( readable ) {

		console.log( holder.input.helper.readable.length )

		holder.input.socket.removeListener("readable", readable)

		// console.log(holder.input.socket._events)

		readable = holder.input.helper.readable.pop()

	}


	// holder.input.socket.unpipe(holder.middle.socket)


}



function middleToInputPipe( object, pipe ) {

	var holder = object || false
	var pipe = pipe

	// console.log(  holder.input.socket._events  )

	function pipeHandler() {


		var data = holder.middle.socket.read()

		if ( data != null ) {

			// console.log("input readable")
			if ( holder.input.socket ) {
				// console.log(data)
				holder.input.socket.write(data)
			}

		}


	}

	if ( pipe == true ) {


		console.log("crosspiping middle to input")
		// console.log(  holder.input.socket._events  )
		// holder.input.socket.pipe(holder.middle.socket)


		holder.middle.socket.on("readable", pipeHandler)

		holder.middle.helper.readable = pipeHandler

	}

	else if ( pipe == false ) {

		console.log("unping middle to input")

		if ( holder.middle.helper.readable ) {

			holder.middle.socket.removeListener( "readable", holder.middle.helper.readable )
			holder.middle.helper.readable = null


			// holder.input.socket.read().length

			// while ( holder.input.socket.readable ) {
			//
			// 	console.log("flushing input")
			// 	var data = holder.input.socket.read()
			// 	holder.middle.socket.write(data)
			//
			//
			// }

		}


	}
	// console.log(holder.middle.helper.readable)


	// console.log (  holder.middle.socket._events  )


}










// function middleToInputPipe( object ) {
//
// 	console.log("crosspiping middle to input")
//
// 	var holder = object || false
//
// 	holder.middle.socket.pipe(holder.input.socket)
//

// }

function middleToInputUnpipe( object ) {

	console.log("unpiping middle to input")

	var holder = object || false

	holder.middle.socket.unpipe(holder.input.socket)


}



function ffmpegToOutputPipe( object ) {

	console.log("crosspiping ffmpeg to output")

	var holder = object || false

	holder.ffmpeg.stdout.pipe(holder.output.socket)


}

function ffmpegToOutputPipe( object ) {

	console.log("unpiping ffmpeg to output")

	var holder = object || false

	holder.ffmpeg.stdout.unpipe(holder.output.socket)


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

	function initEventHandler() {

		console.log("input readable")
		holder.input.socket.removeListener("readable", initEventHandler)

		if ( ! holder.middle.connetion ) middleSocket( holder )

	}


	//cleaning on end
	function endEventHandler() {

		console.log("cleaning input socket")
		inputToMiddlePipe( holder, false )

		holder.middle.socket.end()
		// holder.middle.socket.destroy()

		holder.input.socket = null
		holder.input.readable = null


	}

	function errorEventHandler(e){

		console.log("input socket error: " + e)
		holder.input.socket = null

	}

	holder.input.socket.on("end", endEventHandler)
	holder.input.socket.on("error", errorEventHandler)
	holder.input.socket.on("readable", initEventHandler)

	// holder.input.helper.readable = new Array()
	// holder.input.helper.readable.push(initEventHandler)



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
		inputSocket( holder )

	}

	function errorEventHandler(e){

		console.log("output error: " + e)

	}

	var server = net.createServer( cert )
	server.listen( holder.input.port, holder.input.address )
	server.on("connection", connectionEventHandle)
	server.on("error", errorEventHandler)

	return server

}

















function outputSocket ( object ) {

	var holder = object || false

	if ( holder.ffmpeg.pipeTo.indexOf( holder.output.socket) == -1) {
		console.log("output connection pushing for pipe")
		holder.ffmpeg.pipeTo.push(holder.output.socket)
		// console.log(holder.ffmpeg.pipeTo)
	}

	function readableEventHandler() {

		console.log("output readable on: " + holder.output.port )
		if ( holder.output.socket ) holder.output.socket.read()
		// holder.output.socket.removeListener("readable",readableEventHandler)

	}

	//cleaning on end
	function endEventHandler(d) {

		console.log("cleaning output socket")

		if ( holder.ffmpeg.pipeTo.indexOf( holder.output.socket) != -1) {

			console.log("output connection splice from pipe")
			holder.ffmpeg.pipeTo.splice( holder.ffmpeg.pipeTo.indexOf( holder.output.socket) , 1 );
			// console.log(holder.ffmpeg.pipeTo)
		}
		holder.output.socket = null


	}


	function connectEventHandler(){
		console.log("output connect")

	}

	function errorEventHandler(e){

		console.log("output error: " + e)
		holder.output.socket = null

	}

	holder.output.socket.on("connect", connectEventHandler)
	holder.output.socket.on("readable", readableEventHandler)
	holder.output.socket.on("error", errorEventHandler)
	holder.output.socket.on("end", endEventHandler)

}




function outputServer ( object ) {

	var holder = object || false


	function connectionEventHandler(s) {

		console.log("output connection on: " + holder.output.port )

		var socket = s || false

		if ( ! socket || holder.output.socket ) {

			console.log("output connection denied")
			if ( socket ) socket.end()

			return false

		}

		holder.output.socket = socket
		outputSocket(holder)

	}

	function errorEventHandler(e){

		console.log("output server error: " + e)

	}

	var server = net.createServer()
	server.listen( holder.output.port, holder.output.address )
	server.on("connection", connectionEventHandler)
	server.on("error", errorEventHandler)

	return server

}
