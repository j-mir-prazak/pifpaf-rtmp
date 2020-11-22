const discovery = require('rtmp-swarm')

const port = process.argv[2] || 9999
const key = process.argv[3] || 'rtmp-swarm'

const node = discovery()

node.join(key).listen(port)


node.on('listening', () => {


  const { port } = node.address()

  console.log("onlistening: rtmps://localhost:%s/%s", port, key)



})



node.on('peer', (peer) => {

  console.log('onpeer:', peer);

})

node.on('connection', (s) => {

  // console.log(s)
  console.log('onconnection');

  s.on('data', (d) => {

	   console.log(d)

	})

})
