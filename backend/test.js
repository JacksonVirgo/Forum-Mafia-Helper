const usernameCorrection = require('./tools/formatting/usernameCorrection');
const voteCounter = require('./tools/votecount/voteCounter');
const voteFormatter = require('./tools/votecount/voteFormatter');
const settingsFormatter = require('./tools/votecount/settingsFormatter');

async function test() {
    const thread = 'https://forum.mafiascum.net/viewtopic.php?f=2&t=85772';
    let scrapedThread = await voteCounter.getThreadDataFromURL(thread);

    if (scrapedThread.settings) {
        let scrapedSettings = settingsFormatter.parseSettings(scrapedThread.settings[0].settings);
        console.log(scrapedSettings);
    }
    // const settings = {
    //     players: ['Cook', 'Rannygazoo', 'OopsieDaisy', 'Elements', 'Saudade', 'Firebringer', 'Shigaraki', 'Son of a Shephard', 'NoPowerOverMe', 'DeathNote', 'Luca Blight', 'Datisi', 'Salsabil Faria'],
    //     replacements: {
    //         'Prince Zuko': 'Firebringer',
    //     },
    //     dead: ['Cook', 'Saudade', 'Firebringer', 'Shigaraki', 'Son of a Shephard', 'Salsabil Faria'],
    // };
    // voteFormatter.formatVoteCount(value, settings);
}

module.exports = async () => {
    console.log('Test Start');
    await test();
    console.log('Test End');
};
