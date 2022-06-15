const axios = require("axios");
const querystring = require("querystring");
const {
  TeamsActivityHandler,
  CardFactory,
  TurnContext,
} = require("botbuilder");
const rawWelcomeCard = require("./adaptiveCards/welcome.json");
const rawLearnCard = require("./adaptiveCards/learn.json");
const rawBitcoinCard = require("./adaptiveCards/bitcoin.json");
const cardTools = require("@microsoft/adaptivecards-tools");

const BitcoinService = require("./src/services/bitcoin-service");
const CurrencyHelper = require("./src/helpers/currency-helper");

class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    // record the likeCount
    this.likeCountObj = { likeCount: 0 };

    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");
      let txt = context.activity.text;
      const removedMentionText = TurnContext.removeRecipientMention(
        context.activity
      );
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }

      // Trigger command by IM text
      switch (txt) {
        case "welcome": {
          const card =
            cardTools.AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({
            attachments: [CardFactory.adaptiveCard(card)],
          });
          break;
        }
        case "learn": {
          this.likeCountObj.likeCount = 0;
          const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(
            this.likeCountObj
          );
          await context.sendActivity({
            attachments: [CardFactory.adaptiveCard(card)],
          });
          break;
        }
        case "bitcoin": {
          const bitcoinResult = await BitcoinService.now();
          const price = bitcoinResult.quote.USD.price;
          const priceFormatted = CurrencyHelper.formatToUSD(price);

          await context.sendActivity(priceFormatted);
          break;
        }
        case "bitcoin_card": {
          const bitcoinResult = await BitcoinService.now();
          const price = bitcoinResult.quote.USD.price;
          const priceFormatted = CurrencyHelper.formatToUSD(price);

          const card = cardTools.AdaptiveCards.declare(rawBitcoinCard).render({
            price: priceFormatted,
          });

          await context.sendActivity({
            attachments: [CardFactory.adaptiveCard(card)],
          });

          break;
        }
        /**
         * case "yourCommand": {
         *   await context.sendActivity(`Add your response here!`);
         *   break;
         * }
         */
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    // Listen to MembersAdded event, view https://docs.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bots-notifications for more events
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          const card =
            cardTools.AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({
            attachments: [CardFactory.adaptiveCard(card)],
          });
          break;
        }
      }
      await next();
    });
  }

  // Invoked when an action is taken on an Adaptive Card. The Adaptive Card sends an event to the Bot and this
  // method handles that event.
  async onAdaptiveCardInvoke(context, invokeValue) {
    // The verb "userlike" is sent from the Adaptive Card defined in adaptiveCards/learn.json
    if (invokeValue.action.verb === "userlike") {
      this.likeCountObj.likeCount++;
      const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(
        this.likeCountObj
      );
      await context.updateActivity({
        type: "message",
        id: context.activity.replyToId,
        attachments: [CardFactory.adaptiveCard(card)],
      });
      return { statusCode: 200 };
    }
  }

  // Message extension Code
  // Action.
  handleTeamsMessagingExtensionSubmitAction(context, action) {
    switch (action.commandId) {
      case "createCard":
        return createCardCommand(context, action);
      case "shareMessage":
        return shareMessageCommand(context, action);
      default:
        throw new Error("NotImplemented");
    }
  }

  // Search.
  async handleTeamsMessagingExtensionQuery(context, query) {
    const searchQuery = query.parameters[0].value;
    console.log("handleTeamsMessagingExtensionQuery");

    const attachments = [];

    const btcHeroCard = CardFactory.heroCard(
      "Bitcoin",
      "A decentralized digital currency that can be transferred on the peer-to-peer bitcoin network",
      [
        {
          url: "https://www.aljazeera.com/wp-content/uploads/2022/04/bitcoin-2.jpg",
        },
      ],
      [
        {
          type: "openUrl",
          title: "Official website",
          value: "https://bitcoin.org/en/",
        },
        {
          type: "openUrl",
          title: "See the current price",
          value: "https://coinmarketcap.com/currencies/bitcoin/",
        },
      ]
    );
    // const btcPreviewCard = CardFactory.heroCard("Bitcoin");
    // btcPreviewCard.content.tap = {
    //   type: "invoke",
    //   value: {
    //     name: "Bitcoin",
    //     description:
    //       "A decentralized digital currency that can be transferred on the peer-to-peer bitcoin network",
    //   },
    // };
    const btcAttachment = { ...btcHeroCard };
    console.log("btcAttachment", btcAttachment);
    attachments.push(btcAttachment);

    const ethHeroCard = CardFactory.heroCard(
      "Ethereum",
      "A decentralized, open-source blockchain with smart contract functionality",
      [
        {
          url: "https://thumbor.forbes.com/thumbor/fit-in/900x510/https://www.forbes.com/advisor/ca/wp-content/uploads/2022/05/ethereum-1.jpeg",
        },
      ],
      [
        {
          type: "openUrl",
          title: "Official website",
          value: "https://ethereum.org/en/",
        },
        {
          type: "openUrl",
          title: "See the current price",
          value: "https://coinmarketcap.com/currencies/ethereum/",
        },
      ]
    );
    // const ethPreviewCard = CardFactory.heroCard("Ethereum");
    // ethPreviewCard.content.tap = {
    //   type: "invoke",
    //   value: {
    //     name: "Ethereum",
    //     description:
    //       "A decentralized, open-source blockchain with smart contract functionality",
    //   },
    // };
    const ethAttachment = { ...ethHeroCard };
    attachments.push(ethAttachment);

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: attachments,
      },
    };
  }

  async handleTeamsMessagingExtensionSelectItem(context, obj) {
    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: [CardFactory.heroCard(obj.name, obj.description)],
      },
    };
  }

  // Link Unfurling.
  handleTeamsAppBasedLinkQuery(context, query) {
    const attachment = CardFactory.thumbnailCard("Thumbnail Card", query.url, [
      query.url,
    ]);

    const result = {
      attachmentLayout: "list",
      type: "result",
      attachments: [attachment],
    };

    const response = {
      composeExtension: result,
    };
    return response;
  }
}

function createCardCommand(context, action) {
  // The user has chosen to create a card by choosing the 'Create Card' context menu command.
  const data = action.data;
  const heroCard = CardFactory.heroCard(data.title, data.text);
  heroCard.content.subtitle = data.subTitle;
  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}

function shareMessageCommand(context, action) {
  // The user has chosen to share a message by choosing the 'Share Message' context menu command.
  let userName = "unknown";
  if (
    action.messagePayload &&
    action.messagePayload.from &&
    action.messagePayload.from.user &&
    action.messagePayload.from.user.displayName
  ) {
    userName = action.messagePayload.from.user.displayName;
  }

  // This Message Extension example allows the user to check a box to include an image with the
  // shared message.  This demonstrates sending custom parameters along with the message payload.
  let images = [];
  const includeImage = action.data.includeImage;
  if (includeImage === "true") {
    images = [
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtB3AwMUeNoq4gUBGe6Ocj8kyh3bXa9ZbV7u1fVKQoyKFHdkqU",
    ];
  }
  const heroCard = CardFactory.heroCard(
    `${userName} originally sent this message:`,
    action.messagePayload.body.content,
    images
  );

  if (
    action.messagePayload &&
    action.messagePayload.attachment &&
    action.messagePayload.attachments.length > 0
  ) {
    // This sample does not add the MessagePayload Attachments.  This is left as an
    // exercise for the user.
    heroCard.content.subtitle = `(${action.messagePayload.attachments.length} Attachments not included)`;
  }

  const attachment = {
    contentType: heroCard.contentType,
    content: heroCard.content,
    preview: heroCard,
  };

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [attachment],
    },
  };
}

module.exports.TeamsBot = TeamsBot;
