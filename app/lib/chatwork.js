var _ = require('./lodash'),
    http_verbs = ['get', 'post', 'put', 'delete'];

// enable deferred.
_.mixin(require('./underscore.deferred'));

module.exports = function () {

    var chatwork = {
        apiVersion: 'v1',
        sdkVersion: '0.1.0',
        token: undefined,
        // ----------------------
        Deferred: _.Deferred,
        when: _.when
    };

    var ua = 'Simple-CW-Titanium/' + chatwork.sdkVersion;

    chatwork.init = function (params) {
        params = params || {};
        this.token = params.token;
    };

    chatwork.api = function (method, api) {
        var callback, dfd, done, url, request, params;

        if (_.isFunction(arguments[3])) {
            params = arguments[2];
            callback = arguments[3];
        } else if (_.isFunction(arguments[2])) {
            callback = arguments[2];
        } else {
            dfd = _.Deferred();
        }

        done = function (err, res, data) {
            if (callback) callback(err, res, data);
            if (dfd) return err ? dfd.reject(err) : dfd.resolve(res);
        };

        method = method.toUpperCase();
        url = 'https://api.chatwork.com/' + this.apiVersion + '/' + api;
        request = Ti.Network.createHTTPClient();

        console.debug('Request URI : ' + url);

        request.onload = function () {
            console.warn('ONLOAD');
            var res = JSON.parse(request.responseText),
                data = request.responseData,
                err = res ? res.errors : null;

            done(err, res, data);
            request.onload = null;
            request.onreadystatechange = null;
            request.ondatastream = null;
            request.onerror = null;
            request = null;
        };
        request.onerror = function (e) {
            console.warn('ONERROR');
            console.warn(request.responseText);
            done(e);
            request.onload = null;
            request.onreadystatechange = null;
            request.ondatastream = null;
            request.onerror = null;
            request = null;
        };

        if (method === 'GET') {
            if (_.isObject(params)) {
                url += encodeURIComponent(params);
            }
            request.open(method, url);
            request.setRequestHeader('User-Agent', ua);
            request.setRequestHeader('X-ChatWorkToken', this.token);
            request.setRequestHeader('Accept', 'application/json');
            request.send(null);
        } else {
            request.open(method, url);
            request.setRequestHeader('User-Agent', ua);
            request.setRequestHeader('X-ChatWorkToken', this.token);
            request.setRequestHeader('Accept', 'application/json');
            request.send(params);
        }

        return dfd;
    };

    // methods
    _.each(http_verbs, function (verb) {
        chatwork[verb] = _.partial(chatwork.api, verb);
    });

    return chatwork;
};
