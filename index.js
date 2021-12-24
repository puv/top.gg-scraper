const request = require("request")
const fs = require("fs")

/**
 * @description Gets servers from top.gg and parses them based on the options provided.
 * @param {int} amount (required) Amount of servers to scrape from top.gg
 * @param {object} options (opotional) Options for the scraping
 * @param {string} options.tags (opotional) Tags to filter by
 * @param {string} options.query (opotional) Query to filter by
 * @param {object} extras (opotional) Extra options for the scraping
 * @param {boolean} extras.simplify (opotional) Simplify the output to only contain the server id, name and memberCount
 * @param {boolean} extras.sort (opotional) Sort the output by memberCount
 * @param {boolean} extras.filter (opotional) Filter the output by memberCount
 * @param {int} extras.filterSize (opotional) If extras.filter === true, only return servers with more than this amount of members
 * @param {boolean} extras.write (opotional) Write the output to a file
 * @param {string} extras.file (opotional) If extras.write === true, write results to this file
 * @returns {array} An array of scraped servers.
 */
async function getServers(amount, options = {}, extras = {}) {
    chunkList = await chunks(amount);
    let serverList = [];
    skip = 0;

    for (i in chunkList) {
        let obj = await getUrl(chunkList[i], skip || 0, options.tags || null, options.query || null);
        skip += obj.skip;
        url = obj.url;

        res = await req2await(url);
        list = JSON.parse(res).results;
        serverList = serverList.concat(list);
    }

    serverList = await parseServers(serverList, extras);

    return serverList;
}

/**
 * @description Parses the servers.
 * @param {array} json (required) Array of objects to parse.
 * @param {array} extras (optional) Extra options for the parsing.
 */
async function parseServers(json, extras) {
    if (extras.simplify === true)
        SL = await simplify(json);
    else SL = json;

    if (extras.sort === true)
        SL.sort(compare);

    if (extras.filter === true && extras.filterSize > 0) {
        L = SL.filter(function (s) {
            return s.members > extras.filterSize;
        })
    } else L = SL;

    if (extras.write === true && extras.file != null)
        await write(extras.file, L);

    return L;
}

/**
 * @description Converts from callback function to simple promise cause i'm lazy.
 * @param {string} url (required) Url to request.
 */
async function req2await(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, res, body) {
            if (!error) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

/**
 * @description Splits an array into chunks of a given size.
 * @param {int} amount (required) Number to split into chunks.
 * @param {int} split (optional) Size of each chunk.
 * @returns {array} An array of chunks.
 */
async function chunks(amount, split = 1000) {
    let chunks = [];
    while (amount > split) {
        chunks.push(split);
        amount -= split;
    }
    chunks.push(amount);
    return chunks;
}

/**
 * 
 * @param {string} file (required) File to write array to.
 * @param {array} array (required) Array to write to file.
 */
async function write(file, array) {
    fs.writeFile(file, JSON.stringify(array, null, 2), function (err) {
        if (err)
            return console.log(err);
    });
}

/**
 * @description Compares two objects in a descending order.
 * @param {*} a First object to compare.
 * @param {*} b Second object to compare.
 * @returns {int} -1 if a < b, 0 if a = b, 1 if a > b.
 */
function compare(a, b) {
    if (a.members < b.members) {
        return 1;
    }
    if (a.members > b.members) {
        return -1;
    }
    return 0;
}

/**
 * Simplifies the input to only contain the server id, name and memberCount.
 * @param {array} json (required) Array of objects to simplify.
 * @returns {array} Simplified array.
 */
async function simplify(json) {
    let SL = [];
    for (s in json) {
        SL.push({
            _id: json[s].id,
            name: json[s].name,
            members: json[s].memberCount
        })
    }
    return SL;
}

/**
 * @description Gets the url for the request.
 * @param {int} a (required) Amount of servers to scrape.
 * @param {int} s (required) Amount of servers to skip.
 * @param {string} t (optional) Tag to filter by.
 * @param {string} q (optional) Query to filter by.
 * @returns {string} Url for the request.
 */
async function getUrl(a, s = 0, t = null, q = null) {
    tags = "";
    query = "";
    if (t != null)
        tags = "tags=" + t + "&";
    if (q != null)
        query = "q=" + q + "&";
    return {
        url: `https://top.gg/api/client/entities/search?${query}${tags}platform=discord&entityType=server&amount=${a}&skip=${s}`,
        skip: a
    };
}

module.exports = {
    Get: getServers
}