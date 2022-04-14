import vertica from 'vertica'

export default function (name, cb) {
  describe(name, function () {
    const client = new vertica.Client()

    before(function (done) {
      client.connect(done)
    })

    cb(client)

    after(function (done) {
      client.end()
      client.on('end', done)
    })
  })
}
