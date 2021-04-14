const voteCount = require('./votecount');
const replacement = require('./replacement');
const rolecard = require('./rolecard');
module.exports = {
	addCommands: (socket) => {
		socket.on('votecount', (data) => voteCount(socket, data));
		socket.on('replacement', (data) => replacement(socket, data));
		socket.on('parseCSV', (data) => rolecard.parseCSV(socket, data));
	},
};
