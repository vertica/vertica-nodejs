module.exports = {
  generateSeriesStatement : function (count) {
    let text = 'SELECT 0'
    for (let i = 1; i < count; i++) {
      text += "union SELECT " + i
    }
    return text
  }
}
