import vertica from 'vertica-nodejs'

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

export function generateSeriesStatement(count: number) {
    let text = 'SELECT 0'
    for (let i = 1; i < count; i++) {
      text += "union SELECT " + i
    }
    return text
}
