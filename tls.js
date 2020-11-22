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

var options = {

  key: fs.readFileSync('client-private-key.pem'),
  cert: fs.readFileSync('client-certificate.pem'),
  allowHalfOpen: true

};


var pair = {

  "input":null,
  "middle":null,
  "output":null
}

var certified = tls.createServer(options, function (socket) {
  // console.log(socket)

  pair.input = socket

  // var interval = setInterval( function() {
  //
	// if ( pair.input ) {
  //
	// 	pair.input.write("server end")
  //
	// }
  //
	// else clearInterval(interval)
  //
  //
  //
  //  },1000)

  // socket.setKeepAlive(true, 0);
  console.log("tls connection")
  // socket.write(msg+"\n");
  // socket.pause()

  // pair.input.pause()

  // console.log(pair.input)

  // console.log("connecting")

  socket.once("readable", () => {

	  console.log("tls readable")
      // socket.pause()
	  // socket.read()
	  var middle = new net.Socket()
	  //
	  var socket_middle = middle.connect({
		  "host":"localhost",
		  "port":"1937"
	  }, (s) => {


	  	console.log("connection")
	  })
	  //
	  pair.middle = socket_middle

	  pair.middle.once("readable", () => {

		  pair.middle.resume()
		  console.log("dest readable")

		  pair.middle.pipe(pair.input)



	  })

	  pair.middle.on("connect", () => {

		  console.log("connect")
		  socket.resume()
		  socket.pipe(pair.middle)

		  // socket.on("data", (d) => {
			//   console.log(d)
			//   pair.middle.write(d)
		  //
		  // })

	  })


	  //
	  // socket.write("abc")
		//   socket.on("data", (d) => {
	  //
		// 	  console.log("tls data")
		// 	  // rtmp_socket.write(d)
	  //
		//   })

	  // pair.middle.on("data", (d) => {
	  //
		//   console.log("tcp return")
		//   console.log(d)
	  //
		//   pair.input.write(d)
		//   // pair.input.end()
	  //
	  // })

  })

  socket.on("end", (e) => {
	  pair.input.unpipe(pair.middle)
	  pair.input.write("server end")

	  pair.input = null
	  // pair.middle.end()
	  console.log("tls end")

	  // console.log(pair.input)

  })


}).listen(1935, "0.0.0.0");


var plain = net.createServer(options, function (s) {

	// console.log(s)
	// s.setKeepAlive(true, 0);

  console.log("tcp connection")

  pair.output = s

  s.on("readable", function () {
	var data = s.read()
	pair.output.pause()

    console.log("tcp data")
    console.log(data)
	// pair.output.write( "abc" )

  })

  // pair.output.on("readable", function () {
  //
  //   console.log("tcp readable")
  //
  // })

  pair.input.pipe(pair.output)
  // pair.output.pipe(pair.input)

  pair.input.resume()

// console.log(pair.input.read())

  pair.output.on("end", function (e) {
		console.log("tcp end")
	})

  // s.write(msg+"\n");



}).listen(1936);
