import React from 'react'
import io from 'socket.io-client';
//import { createSocket } from '../scripts/websockets';
import { findBestMatch } from 'string-similarity';

export default class VoteCount extends React.Component {
    socket = null;
    state = {
        result: '',
        progress: ''
    }
    componentDidMount() {
        this.initSocketConnection();
        this.setupSocketListeners();
    }
    componentWillUnmount() {
        this.closeSocketConnection();
    }
    initSocketConnection() {
        this.socket = io.connect()
    }
    closeSocketConnection() {
        this.socket.disconnect();
    }
    onClientDisconnected() {
        console.log('Disconnected from Server');
    }
    onReconnection() {
        console.log('Reconnected to Server');
    }
    onVoteCount(data) {
        let format = formatVoteCount(data.voteCount, data.settings);
        this.setState({ progress: '', result: format });
        //new FormatVoteCount(data);
    }
    onProgress(data) {
        this.setState({ progress: `[${data.currentPage / data.lastPage * 100}%]` });
    }
    onPing(data) {
        console.log('onPing', data);
    }
    onError(data) {
        console.log(data);
    }
    setupSocketListeners() {
        this.socket.on('votecount', this.onVoteCount.bind(this));
        this.socket.on('progress', this.onProgress.bind(this));
        this.socket.on('ping', this.onPing.bind(this));
        this.socket.on('error', this.onError.bind(this));
        this.socket.on('reconnect', this.onReconnection.bind(this));
        this.socket.on('disconnected', this.onClientDisconnected.bind(this));
    }
    onFormSubmit(e) {
        e.preventDefault();
        this.socket.emit('votecount', { url: 'https://forum.mafiascum.net/viewtopic.php?f=2&t=85556' });
        this.setState({ progress: '[0%]' });
        console.log('Form Submitted');
    }
    render() {
        return (
            <form onSubmit={this.onFormSubmit.bind(this)}>
                <label htmlFor='gameUrl'>Link to Game Thread</label>
                <input id='gameUrl' name='gameUrl' type='text' />
                <br />
                <label htmlFor='correction'>Spelling Correction</label>
                <input id='correction' name='correction' type='range' min='0' max='100' value='50' onChange={() => { }} />
                <br />
                <input type='submit' value='Generate' />
                <br />
                <h2>Result <span>{this.state.progress}</span></h2>
                <textarea name='result' value={this.state.result} readOnly />
            </form>
        );
    }
}

function formatVoteCount(voteCount, settings) {
    let clean = cleanVoteCount(voteCount, settings);
    let voteCountStr = '[area=Vote Count]';
    for (const wagonHandle in clean.wagons) {
        let wagon = clean.wagons[wagonHandle];
        if (wagon.length >= 1) {
            let wagonStr = `\n[b]${wagonHandle} (${wagon.length})[/b] `;
            for (let i = 0; i < wagon.length; i++) {
                wagonStr += `${wagon[i].author}`;
                if (i < wagon.length)
                    wagonStr += ', ';
            }
            voteCountStr += wagonStr;
        }
    }
    voteCountStr += '[/area]';
    return voteCountStr;
}
function cleanVoteCount(voteCount, settings) {
    const voteData = { votes: {}, wagons: {} };
    for (const category in voteCount) {
        if (!voteData[category]) voteData[category] = {};
        for (const user in voteCount[category]) {
            let votePost = voteCount[category][user];
            let voteCorrection = new VoteCorrection(votePost, settings, category);
            let cor = voteCorrection.correct();
            if (cor.valid) {
                let vote = cor.vote.votes[category].vote;
                if (!voteData.wagons[vote]) voteData.wagons[vote] = [];
                voteData.wagons[cor.vote.votes[category].vote].push(cor.vote);
            } else {

            }
        }
    }
    return voteData;
}

class VoteCorrection {
    constructor(votePost, settings, category) {
        this.votePost = votePost;
        this.settings = settings;
        this.category = category;
    }
    correct() {
        let corrected = this.spelling();
        let current = this.current(this.votePost.post?.number);
        let dead = this.dead(this.votePost.author);
        return { vote: corrected.vote, valid: corrected.validity && current && !dead };
    }
    dead(user) {
        let isDead = false;
        for (let dead of this.settings.dead) {
            let deadRoot = this.rootUser(dead);
            let userRoot = this.rootUser(user);
            if (deadRoot.target === userRoot.target) {
                isDead = true;
            }
        }
        return isDead;
    }
    current(number) {
        return parseInt(number) > parseInt(this.settings.days[this.settings.days.length - 1]);
    }
    spelling() {
        let result = this.votePost;
        let vote = result.votes[this.category]?.vote;
        let validity = false;
        if (vote) {
            let cor = this.rootUser(vote);
            if (cor.rating >= this.settings.correctionWeight || 0.7) {
                result.votes[this.category].vote = this.settings.alias[cor.target];
                validity = !!result.votes[this.category].vote;
            }
        }
        return { vote: result, validity };
    }
    rootUser(user) {
        return findBestMatch(user, this.settings.totalnames).bestMatch;
    }
}

class FormatVoteCount {
    constructor() {
        this.voteCount = null;
        this.settings = null;
    }
    init(voteCount, settings) {
        this.voteCount = voteCount;
        this.settings = settings;
    }
    clean() {
        const voteData = { votes: {}, wagons: {} };
        const slotData = { slots: this.settings.slots, votes: {} };
        for (const category in this.voteCount) {
            if (!voteData[category]) voteData[category] = {};
            for (const user in this.voteCount[category]) {
                let cor = this.correctVote(this.voteCount[category][user], category);
                if (cor.validity) {
                    let curVote = cor.vote;
                    let { author } = curVote;
                    if (slotData.slots[author]) {
                        if (!voteData.votes[category]) voteData.votes[category] = {};
                        if (!voteData.votes[category][slotData.slots[author]]) voteData.votes[category][slotData.slots[author]] = [];
                        if (!voteData.wagons[curVote.votes[category].vote]) voteData.wagons[curVote.votes[category].vote] = [];
                        voteData.votes[category][slotData.slots[author]].push(curVote);
                        voteData.wagons[curVote.votes[category].vote] = this.placeVoteInWagon(voteData.wagons[curVote.votes[category].vote], curVote);
                    }
                }
            }
        }
        return voteData;
    }
    placeVoteInWagon(wagon, vote) {
        wagon.push(vote);
        return this.sortWagon(wagon);
    }
    sortWagon(wagon) {
        if (wagon.length <= 1)
            return wagon;
        let left = [], right = [], newArray = [], pivot = wagon.pop(), length = wagon.length;
        for (let i = 0; i < length; i++) {
            if (wagon[i].post.number <= pivot.post.number) {
                left.push(wagon[i]);
            } else {
                right.push(wagon[i]);
            }
        }
        return newArray.concat(this.sortWagon(left), pivot, this.sortWagon(right));
    }

    generateSlotData(slotData, category, author) {
        if (!slotData.votes[category])
            slotData.votes[category] = {};
        if (!slotData.votes[category][slotData.slots[author]])
            slotData.votes[category][slotData.slots[author]] = [];
        return slotData;
    }
    correctVote(votePost, category) {
        let { vote, validity } = this.correctPostSpelling(votePost, category);
        validity = validity && this.isPostNumberCurrent(votePost.post?.number);
        validity = validity && this.isSlotDead(votePost.author);
        return { vote, validity };
    }
    isSlotDead(author) {
        for (let dead of this.settings.dead) {
            let deadRoot = this.getRootAuthor(dead);
            let authorRoot = this.getRootAuthor(author);
            if (deadRoot.target === authorRoot.target)
                return false;
        }
        return true;
    }
    isPostNumberCurrent(number) {
        let current = parseInt(number) > parseInt(this.settings.days[this.settings.days.length - 1]);
        console.log(`Post ${number} is ${current}`);
        return current;
    }
    correctPostSpelling(votePost, category) {
        let vote = votePost.votes[category]?.vote,
            validity = false;
        if (vote) {
            let cor = this.getRootAuthor(vote);
            if (cor.rating >= this.settings.correctionWeight) {
                votePost.votes[category].vote = this.settings.alias[cor.target];
                validity = true;
            }
        }
        return { vote: votePost, validity };
    }
    getRootAuthor(author) {
        let bestMatch = findBestMatch(author, this.settings.totalnames);
        return bestMatch.bestMatch;
    }
}

// /**
//  * Cleans vote data in a format that makes it easier to format.
//  * @param {Object} voteCount Vote data
//  * @param {Object} settings Settings object
//  */
// // eslint-disable-next-line 
// function cleanVoteCount({ voteCount, settings }) {
//     // Going to make this slow but obvious and then slowly combine it at a later date.
//     const voteData = {
//         votes: {}, // Combined slot votes.
//         wagons: {} // Wagon data
//     };
//     const slotData = {
//         slots: settings.slots,
//         votes: {
//             //example: [vote1, vote2, vote3]
//         }
//     }
//     for (const voteCategory in voteCount) {
//         voteData[voteCategory] = voteData[voteCategory] ? voteData[voteCategory] : {};
//         for (const user in voteCount[voteCategory]) {
//             let userVote = voteCount[voteCategory][user];
//             let author = userVote.author;
//             if (slotData.slots[author]) {
//                 if (!slotData.votes[voteCategory])
//                     slotData.votes[voteCategory] = {};
//                 if (!slotData.votes[voteCategory][slotData.slots[author]])
//                     slotData.votes[voteCategory][slotData.slots[author]] = [];
//                 slotData.votes[voteCategory][slotData.slots[author]].push(userVote);


//             }
//         }
//     }

//     // Correct spelling
//     // Order the votes from earliest to latest.
//     // Remove any votes that have a post number before the latest SoD.
//     //

//     for (const voteCategory in slotData.votes) {
//         for (const user in slotData.votes[voteCategory]) {
//             let sortedSlotVotes = quickSortVotes(slotData.votes[voteCategory][user]);
//             slotData.votes[voteCategory][user] = sortedSlotVotes;
//             let currentVote = sortedSlotVotes[0];
//             if (currentVote.votes[voteCategory]) {
//                 let currentVoted = currentVote.votes[voteCategory].vote;
//                 let bestMatch = findBestMatch(currentVoted, settings.players);
//                 if (bestMatch.bestMatch.rating >= 0.5) {
//                     if (!voteData.wagons[voteCategory]) voteData.wagons[voteCategory] = {};
//                     if (!voteData.wagons[voteCategory][bestMatch.bestMatch.target]) voteData.wagons[voteCategory][bestMatch.bestMatch.target] = [];
//                     voteData.wagons[voteCategory][bestMatch.bestMatch.target].push(currentVote);
//                 } else {
//                     console.log(`${currentVoted} has been yeeted at ${bestMatch.bestMatch.rating}`);
//                 }
//             }
//         }
//     }
//     return voteData;

// }
// // eslint-disable-next-line 
// function formFatVoteCount(voteCount, unknownVotes, settings) {
//     let formattedVoteCount = 'f';
//     console.log(voteCount);
//     //const wagons = {};

//     for (const voteCategory in voteCount) {
//         let voteCategoryWagon = '';
//         for (const wagon in voteCount[voteCategory]) {
//             const wagonList = voteCount[voteCategory][wagon];
//             let wagonVotes = `[b]${wagon} (${wagonList.length})[/b]`;
//             let isFirst = true;
//             for (const vote of wagonList) {
//                 wagonVotes += `${isFirst ? '' : ', '}${wagonList.vote}[url=${vote.url}][${vote.post}][/url]`;
//                 isFirst = false;
//             }
//             voteCategoryWagon += wagonVotes += '\n';
//         }
//         formattedVoteCount += voteCategoryWagon;
//     }
//     return formattedVoteCount;
// }

// function quickSortVotes(origArray) {
//     if (origArray.length <= 1)
//         return origArray;
//     let left = [], right = [], newArray = [], pivot = origArray.pop(), length = origArray.length;
//     for (let i = 0; i < length; i++) {
//         if (origArray[i].post.number >= pivot) {
//             left.push(origArray[i])
//         } else {
//             right.push(origArray[i]);
//         }
//     }
//     return newArray.concat(quickSortVotes(left), pivot, quickSortVotes(right));
// }