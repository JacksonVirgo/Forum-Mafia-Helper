function absolute(base, relative) {
    if (!base && !relative) {
        return null;
    }
    var stack = base.split("/"),
        parts = relative.split("/");
    stack.pop(); // remove current file name (or empty string)
    // (omit if "base" is the current folder without trailing slash)
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] == ".") continue;
        if (parts[i] == "..") stack.pop();
        else stack.push(parts[i]);
    }
    return stack.join("/");
}

function getParams(url) {
    let paramsRoot = url.split("?")[1];
    let paramsList = paramsRoot.split("&");
    let result = {};
    for (let param of paramsList) {
        let split = param.split("=");
        result[split[0]] = split[1];
    }
    return result;
}

module.exports = {
    absolute,
    getParams,
};
