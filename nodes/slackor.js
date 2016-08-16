module.exports = function(RED) {

    // Load required modules
    const SlackClient       = require('@slack/client').RtmClient;
    const MemoryDataStore = require('@slack/client').MemoryDataStore;

    const CLIENT_EVENTS    = require('@slack/client').CLIENT_EVENTS;
    const RTM_EVENTS      = require('@slack/client').RTM_EVENTS;
    const CLIENT_RTM_EVENTS = require('@slack/client').CLIENT_EVENTS.RTM;

    /**
     * Slackor module
     */
    var Slackor = (function(){

        // Expose properties & methods
        var public = {};

        return public;
    })();

    /**
     * Manages SlackClients
     */
    Slackor.Clients = (function(){
        var _list = [];

        /**
         * Creates a new client
         */
        var _create = function(token) {
            var client = new SlackClient(token, {
                logLevel: 'none',
                dataStore: new MemoryDataStore(),
            });
            client.start();

            // Client start success
            client.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
                console.log(`Slackor ~ logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}`);
            });

            // Client start failure (may be recoverable)
            client.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, function(rtmStartData) {
                console.log(`Slackor ~ failed to start client ${rtmStartData}`);
                return false;
            });

            return client;
        };

        /**
         * Retrieves a client by API token
         */
        var getByToken = function(token) {

            if(token == null || token.trim() == '') {
                console.log('Slackor ~ no token specified');
                return false;
            }

            // Create a new client if it doesn't already exist
            if(_list[token] == null) {
                _list[token] = _create(token);
            }

            return _list[token];
        };

        /**
         * Deletes a client by API token
         */
        var deleteByToken = function(token) {
            if(_list[token] != null) {
                _list[token].disconnect();
                _list[token] = null;
                console.log('Slackor ~ deleted connection for token: ' + token);
            }
        };

        // Expose properties & methods
        var public = {};

        public.getByToken = getByToken;
        public.deleteByToken = deleteByToken;

        return public;
    })();

    /**
     * Speaker
     */
    Slackor.Speaker = (function(config){

        RED.nodes.createNode(this, config);

        var token  = config.apiToken;
        var client = Slackor.Clients.getByToken(token);
        var node = this;

        if(client) {
            client.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {

                var channel = client.dataStore.getGroupByName(config.channel)
                    || client.dataStore.getChannelByName(config.channel);

                if(channel == null) {
                    console.log('Slackor ~ channel not found');
                    return node;
                }

                node.on('input', function(message) {
                    client.sendMessage(message.payload.toString(), channel.id, function messageSent() {
                        console.log('Slackor ~ sent message on channel: ' + config.channel);
                    });
                });
            });

            node.on('close', function() {
                Slackor.Clients.deleteByToken(token);
            });

            return node;
        }
    });

    /**
     * Speaker
     */
    Slackor.Auditor = (function(config){

        RED.nodes.createNode(this, config);

        var token  = config.apiToken;
        var client = Slackor.Clients.getByToken(token);
        var node = this;

        if(client) {
            client.on(RTM_EVENTS.MESSAGE_ME_MESSAGE, function (message) {

            });
            client.on(RTM_EVENTS.MESSAGE, function (message) {

                var listen = false;

                //if (message.text.includes(`<@${client.activeUserId}>`)) {
                    var channel = client.dataStore.getDMById(message.channel)
                        || client.dataStore.getGroupById(message.channel)
                        || client.dataStore.getChannelById(message.channel);

                    if(config.channels.trim() !== '') {
                        var watchedChannels = config.channels.split(",");
                        if(watchedChannels.indexOf(channel.name) > -1) {
                            listen = true;
                        }
                    } else {
                        listen = true;
                    }

                    if(listen) {
                        node.send(message);
                        console.log('Slackor ~ received message on channel: ' + channel.name);
                    }
                //}

            });

            node.on('close', function() {
                Slackor.Clients.deleteByToken(token);
            });

            return node;
        }
    });

    RED.nodes.registerType("slackor-auditor", Slackor.Auditor);
    RED.nodes.registerType("slackor-speaker", Slackor.Speaker);
};