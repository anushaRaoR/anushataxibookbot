
const { ActivityTypes,CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { DialogSet, NumberPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

    // Adaptive Card content
const IntroCard = require('./resources/IntroCard.json');
const { SlotFillingDialog } = require('./slotFillingDialog');
const { SlotDetails } = require('./slotDetails');
const DIALOG_STATE_PROPERTY = 'dialogState';
const WELCOMED_USER = 'welcomedUserProperty';

class AnuhsaTaxiBookBot {

    constructor(application, luisPredictionOptions,conversationState, userState) {
        this.conversationState = conversationState;
        this.userState = userState;
        this.luisRecognizer = new LuisRecognizer(application, luisPredictionOptions, true);
        this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.dialogs = new DialogSet(this.dialogState);
      

        const fullnameSlots = [
            new SlotDetails('first', 'text', 'Please enter your first name.'),
            new SlotDetails('last', 'text', 'Please enter your last name.')
        ];

        const fromAddressSlots = [
            new SlotDetails('street', 'text', 'Please enter your street address.'),
            new SlotDetails('city', 'text', 'Please enter the city.'),
            new SlotDetails('zip', 'text', 'Please enter your zipcode.')
        ];

        const destinationAddressSlots = [
            new SlotDetails('street', 'text', 'Please enter your destination street address.'),
            new SlotDetails('city', 'text', 'Please enter destination city.'),
            new SlotDetails('zip', 'text', 'Please enter your destination zipcode.')
        ];

        const slots = [
            new SlotDetails('fullname','fullname'),
            new SlotDetails('fromAddress','fromAddress'),
            new SlotDetails('destinationAddress','destinationAddress')
        ]
        this.dialogs.add(new SlotFillingDialog('fullname', fullnameSlots));
        this.dialogs.add(new TextPrompt('text'));
        this.dialogs.add(new NumberPrompt('number'));
        this.dialogs.add(new SlotFillingDialog('fromAddress', fromAddressSlots));
        this.dialogs.add(new SlotFillingDialog('destinationAddress', destinationAddressSlots));

        this.dialogs.add(new SlotFillingDialog('slot-dialog', slots));

        this.dialogs.add(new WaterfallDialog('root', [
            this.startDialog.bind(this),
            this.processResults.bind(this)
        ]));

    }

    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {

        if (turnContext.activity.type === ActivityTypes.Message) {
            // Create dialog context.
            const dc = await this.dialogs.createContext(turnContext);
            let text = turnContext.activity.text;
            let transportProviders = ["Uber","Lyft","Ola"];
            if(transportProviders.includes(text)){
                await dc.beginDialog('root');
            }
            const utterance = (turnContext.activity.text || '').trim().toLowerCase();
            if (utterance === 'cancel') {
                if (dc.activeDialog) {
                    await dc.cancelAllDialogs();
                    await dc.context.sendActivity(`Ok... canceled.`);
                } else {
                    await dc.context.sendActivity(`Nothing to cancel.`);
                }
            }

            if (!dc.context.responded) {
                // Continue the current dialog if one is pending.
                await dc.continueDialog();
            }

            if (!dc.context.responded) {
                // If no response has been sent, start the onboarding dialog.
                await turnContext.sendActivity({
                                text: 'Book a Taxi',
                                attachments: [this.createAnimationCard()]
                            });
            }

        } else if (
            turnContext.activity.type === ActivityTypes.ConversationUpdate &&
             turnContext.activity.membersAdded[0].name !== 'Bot'
        ) {
            // Send a "this is what the bot does" message.
            const description = [
                'This is a bot that demonstrates an alternate dialog system',
                'which uses a slot filling technique to collect multiple responses from a user.',
                'Say anything to continue.'
            ];
            await turnContext.sendActivity(description.join(' '));
        }

        await this.conversationState.saveChanges(turnContext);
    }
 
    async startDialog(step) {
        return await step.beginDialog('slot-dialog');
    }


    async processResults(step) {
       
        const values = step.result.values;

        const fullname = values['fullname'].values;
        const fromAddress = values['fromAddress'].values;
        const destinationAddress = values['destinationAddress'].values;
        await step.context.sendActivity({ text : 'Booking Confirmed', attachments: [this.createThankYouCard()]});
        await step.context.sendActivity(`Your name is ${ fullname['first'] } ${ fullname['last'] }.`);
        await step.context.sendActivity(`Your address is: ${ fromAddress['street'] }, ${ fromAddress['city'] } ${ fromAddress['zip'] }`);
        await step.context.sendActivity(`Your destination address is: ${ destinationAddress ['street'] }, ${ destinationAddress ['city'] } ${ destinationAddress ['zip'] }`);   
        await step.context.sendActivity(`Your ride is booked. Will arrive shortly to your pickup place.`)
        return await step.endDialog();
    }

    
    createThankYouCard() {
        return CardFactory.animationCard(
            'Thank you for using Anusha`s Taxi booking',
            [{url : 'https://media2.giphy.com/media/3og0IFip0zn2loy5l6/source.gif'}]
        )
    }

    createAnimationCard() {
        return CardFactory.animationCard(
            'Book a Taxi',
            [
                { url: 'https://thumbs.gfycat.com/GiganticAmazingAdder-size_restricted.gif' }
            ],
            CardFactory.actions([{
                "type" : "imBack",
                "title": "Book an Uber",
                "value": "Uber",
                "text" : "Uber"
              },
              {
                "type" : "imBack",
                "title": "Book a Lyft",
                "value": "Lyft",
                "text" : "Lyft"
              },
              {
                "type" : "imBack",
                "title": "Book an Ola",
                "value": "Ola",
                "text" : "Olar"
              }]) 
            )
    }
}

module.exports.AnuhsaTaxiBookBot = AnuhsaTaxiBookBot;
