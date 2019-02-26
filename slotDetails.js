class SlotDetails {
    constructor(name, promptId, prompt, reprompt) {
        this.name = name;
        this.promptId = promptId;
        if (prompt && reprompt) {
            this.options = {
                prompt: prompt,
                retryPrompt: reprompt
            };
        } else {
            this.options = prompt;
        }
    }
}

module.exports.SlotDetails = SlotDetails;