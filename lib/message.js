function parse(rowData) {
    this.data = rowData.data;
}

var message = {
    parse: parse
};

module.exports = message;
