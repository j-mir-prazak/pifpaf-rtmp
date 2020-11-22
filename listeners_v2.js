var tls = require('tls'),
    fs = require('fs'),
    // colors = require('colors'),
    msg = [
            ".-..-..-.  .-.   .-. .--. .---. .-.   .---. .-.",
            ": :; :: :  : :.-.: :: ,. :: .; :: :   : .  :: :",
            ":    :: :  : :: :: :: :: ::   .': :   : :: :: :",
            ": :: :: :  : `' `' ;: :; :: :.`.: :__ : :; ::_;",
            ":_;:_;:_;   `.,`.,' `.__.':_;:_;:___.':___.':_;"
          ].join("\n").cyan;


var net = require('net')


var string_decoder = require('string_decoder');
var decoder = new string_decoder.StringDecoder('utf8');




var options = {

  key: fs.readFileSync('client-private-key.pem'),
  cert: fs.readFileSync('client-certificate.pem'),
  allowHalfOpen: true

};


var pair = {

  "input":null,
  "middle":null,
  "output":null,
  "crosspiped":null
}

function crossPipe( pair ) {

	var input = pair.input || false
	var output = pair.output || false
	var status = pair.crosspiped

	if ( input && output && !status ) {

		// pair.input.on("readable", () => {
		//
		// 	console.log("input again readable")
		// //
		//
		// 	var data = pair.input.read()
		//
		//     // console.log(data)
		//
		//     var state = false
		// 	if ( data ) state = pair.output.write ( data, function() { }  )
		//   	console.log("tls -> tcp writen: " + state)
		//
		// //
		// })
		//
		// pair.output.on("readable", function () {
		//
		// 	console.log("ouput again readable")
		//
		// 	var data = pair.output.read();
		//
		// 	// console.log(data)
		//
		// 	var state = false
 		// 	if ( data ) state = pair.input.write ( data, function() { } )
		//
		// 	console.log("tcp -> tls writen: " + state)
		//
		// })



		if ( pair.input.readable ) {

			console.log("tls crumb")

			var data = pair.input.read()

		    // console.log(data)

		    var state = false
			if ( data ) state = pair.output.write ( data, function() { }  )
		  	console.log("tls -> tcp writen: " + state)


		}


		if ( pair.output.readable ) {

			console.log("tcp crumb")

			var data = pair.output.read();

			// console.log(data)

			var state = false
 			if ( data ) state = pair.input.write ( data, function() { } )

			console.log("tcp -> tls writen: " + state)

		}

		pair.input.pipe(pair.output)
		pair.output.pipe(pair.input)

		console.log("crosspiping")

		// input.resume()
		// output.resume()

		pair.crosspiped = true






	}
	else {

		console.log("not crosspiping")

	}

}




var certified = tls.createServer(options, function (socket, b) {

  pair.input = socket
  // crossPipe(pair)

  // for ( i in socket ) {
	//   console.log(typeof socket[i] + "\t" +i )
  //
  // }

  console.log("tls connection")

  console.log(socket.address())

  console.log(socket.remoteAddress)
  console.log(socket.remotePort)

  console.log(socket.localAddress)
  console.log(socket.localPort)


   pair.input.once("readable", () => {
	   console.log("tls readable inside")
	   crossPipe( pair )

   })
	// console.log(typeof pair.output)
  //
	// console.log("tls readable")
  //
  //
	// 	if ( typeof pair.input == "object" ) {
  //
	// 		// pair.middle = tcp_connect( "127.0.0.1", 6001, pair )
	// 		var data = pair.input.read()
  //
	// 		console.log ("input to output " + pair.output.write( data ) )
  //
	// 		pair.input.pipe(pair.output)
  //
	// 		// pair.input.on("readable", () => {
	// 		//
	// 		// 	// console.log ("tls readable")
	// 		//
	// 		//
	// 		//
	// 		// })
	// 		// var state = pair.output.write ( data, function() {
	// 		// 	  console.log("tcp writen")
	// 		//   }  )
	// 	  // console.log(state)
  //
	// 	}
  //


  socket.on("end", (e) => {

	  console.log("tls end")

	  // console.log(pair.input)

  })


}).listen(6000, "0.0.0.0");



function tcp_connect( host, port, pair ) {

	var host = host || false
	var port = port || false

	console.log( "tcp connecting to server")
	var middle = new net.Socket()

	middle.connect({
		"host":host,
		"port":port
	}, (s) => {

	})

	// console.log( middle )
	middle.once("readable", () => {

		var data = pair.middle.read()

		console.log ("output to input " + pair.input.write( data ) )

		pair.middle.pipe(pair.input)



	})

	return middle;

}


var outside = net.createServer(options, function (socket) {

  pair.output = socket

  console.log("outside tcp connection")
  crossPipe(pair)


  pair.output.on("end", function (e) {

		console.log("outside tcp end")

	})

  // s.write(msg+"\n");


}).listen(6006, "0.0.0.0");
















var plain = net.createServer(options, function (socket) {

  pair.output = socket

  console.log("tcp connection")

  pair.output.once("readable", () => {
	  console.log("tcp readable inside")
	  crossPipe(pair)

  })


  pair.output.on("end", function (e) {

		console.log("tcp end")

	})

  // s.write(msg+"\n");


}).listen(6002, "0.0.0.0");









const discovery = require('rtmp-swarm')

const port = process.argv[2] || 6001
const key = process.argv[3] || 'rtmp'

const node = discovery()

node.join(key).listen(port)

node.on('listening', () => {
  const { port } = node.address()
  console.log("onlistening: rtmp://localhost:%s/%s", port, key)
})

node.on('peer', (peer) => {

  console.log('onpeer:', peer);
})

node.on('connection', () => {

  console.log('onconnection');
})
