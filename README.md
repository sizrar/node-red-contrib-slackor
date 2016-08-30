# Slackor

A simple node that allows to listen and speak in Slack.

## Slackor Auditor

Listens in slack channels the associated Slack Bot has joined. A list of channels can be specified to limit the channels which are listened to.

### Configuring behavior
* **Slack Channels:** you can control which slack channels are listened to by specifying them in the node's configuration properties. Seperate multiple channels by commas without spaces. (i.e: `general,channel1,channel2`). **Note:** This node can only listen to channels in which the associated Slack Bot has been invited.

## Slackor Speaker

Speaks in slack a single slack channel which the associated Slack Bot has joined.

### Configuring behavior:
* **Slack Channel:** control the slack channel by passing the slack channel id as the <code>msg.channel.id</code> property. The Slackor Auditor node passes the id of channel in which it hears a message as the same property. Therefore, by default, the Slackor Speaker node speaks in the same channel the Slackor Auditor node hears.
* **Message content:** pass a message via `msg.payload`