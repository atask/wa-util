function parse(rowData) {
    this.chats = [];
    this.title = rowData.display_name;
}

var chat = {
    parse: parse
};

module.exports = chat;
