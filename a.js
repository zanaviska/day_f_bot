'use strict';

const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const alfa_token = '5090989926:AAFe4gR5yfdihI7vfqZIekNG0vsfo_eKd4E';
const beta_token = '5062338123:AAFWiJQxLbu-f3Lej1cNfAqAhSQL4XfcvWI';

// const day_f_chat_id = -1001651566770;//for tests
const day_f_chat_id = -1001725276250;//real one
const tokens_chat_id = -1001733712953;


const alfa_msgA = "Greetings, how can I help you?";
const alfa_login = "rabbitHole".toLocaleLowerCase();
const alfa_msgB = "Specify your problem";
const alfa_password = "lostInTheF".toLocaleLowerCase();
const alfa_msgC = "Out of my jurisdiction. Please contact another agent";

const beta_msgA = "Beschreiben Sie Ihr Problem";
const beta_login = "Wachter".toLocaleLowerCase();
const beta_msgB = "Klären Sie Ihr Problem";
const beta_password = "Täuschung".toLocaleLowerCase();
const beta_msgC = "Anfrage bearbeiten, github.com/artoman42/Agent-1984";

// Create a bot that uses 'polling' to fetch new updates
const alfa_bot = new TelegramBot(alfa_token, {polling: true});
const beta_bot = new TelegramBot(beta_token, {polling: true});

const userMsgRemoveTime = 3000;
const repeatMsgTime = 45000;

const repeatAction = func => {
  func().catch(async res => {
    if (e.response.statusCode == 429) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      repeatAction(func);
    } else {
      console.log(e.response)
    } 
  })
}

function recursiveSender(bot, message, callback) {
  repeatAction(() => bot.sendMessage(day_f_chat_id, message).then(res => {
    setTimeout(() => {
      repeatAction(() => bot.deleteMessage(day_f_chat_id, res.message_id));
      setTimeout(() => callback(bot, message, callback), repeatMsgTime)
    }, repeatMsgTime);
  }))
}

const beforeLoginState = 0;
const afterLoginState = 1;
const wrongPasswordState = 2;
const correctPasswordState = 3;

const temproraryUnlistenedUsers = [];

function onMessage(bot, msgA, msgB, loginSpecCode, password, msgC, callback, othercallback) {
  const userState = [];
  return () => {
    bot.on('message', (msg) => {
      if (msg.chat.type !== 'private' && msg.chat.id !== day_f_chat_id)
        return;

      const chatId = msg.chat.id;
      const senderId = msg.from.id;
      const msgId = msg.message_id;
      
      callback(chatId, msgId)
      
      if (chatId == day_f_chat_id)
        return;
      
      // console.log(msgId)
      
      if (temproraryUnlistenedUsers[senderId])
        return;
      switch (userState[senderId]) {
        case afterLoginState:
          
          if (msg.text.toLocaleLowerCase() == password) {
            userState[senderId] = correctPasswordState;
            repeatAction(() => bot.sendMessage(tokens_chat_id, `@${msg.from.username} #password`).catch(() => { }))
            repeatAction(() => bot.sendMessage(chatId, msgC).then(res => {othercallback(msg.from, res.message_id);}));
          }
          else {
            temproraryUnlistenedUsers[senderId] = true;
            setTimeout(() => {
              temproraryUnlistenedUsers[senderId] = false;
            }, 15000);
          }
          break;
        case wrongPasswordState:
          break;
        case correctPasswordState:
          break;
        //for beforeLoginState and new user aka undefined
        default:
          if (msg.text.toLocaleLowerCase() == loginSpecCode) {
            userState[senderId] = afterLoginState;
            repeatAction(() => bot.sendMessage(chatId, msgB));
            repeatAction(() => bot.sendMessage(tokens_chat_id, `@${msg.from.username} #login`).catch(e => {}))
          } else { 
            bot.sendMessage(chatId, msgA);
            temproraryUnlistenedUsers[senderId] = true;
            setTimeout(() => {
              temproraryUnlistenedUsers[senderId] = false;
            }, 5000);
          }
          break;
      }
    });
  }
}

recursiveSender(alfa_bot, "If you have a complaint against the administration, describe your complaint to the agents", recursiveSender)
setTimeout(() => recursiveSender(beta_bot, "Die Agenten halten Ordnung im Chat, wenn dir etwas auffällt, lass es uns bitte wissen", recursiveSender), repeatMsgTime);
// regular_sender_clojure(beta_bot)("this is beta bot")
// regular_sender_clojure(alfa_bot)("this is alpha bot")

const waitForToken = [];

onMessage(alfa_bot, alfa_msgA, alfa_msgB, alfa_login, alfa_password, alfa_msgC, function (chatId, msgId) {
  if (chatId !== day_f_chat_id)
    return;
  // console.log(msgId)
  setTimeout(() => {
    repeatAction(() => alfa_bot.deleteMessage(chatId, msgId));
  }, userMsgRemoveTime)
}, (user, ) => {
  beta_bot.restrictChatMember(day_f_chat_id, user.id).catch((err) => {
    console.log("trying to remove admin");
  })
})()
onMessage(beta_bot, beta_msgA, beta_msgB, beta_login, beta_password, beta_msgC, (chatId, msgId) => { }, (user) => {
  waitForToken[user.id] = user;
  beta_bot.banChatMember(day_f_chat_id, user.id).then(res => {
    // console.log(res)
    // beta_bot.unbanChatMember(day_f_chat_id, user.id);
  }).catch((err) => {
    console.log("trying to remove admin");
  })
})();

beta_bot.onText(/\/sendcontact (.+)/, (msg, match) => {
  const userId = msg.from.id;
  const resp = match[1]; // the captured "whatever"

  
  const user = waitForToken[userId];
  if (user) {
    repeatAction(() => beta_bot.sendMessage(tokens_chat_id, `@${user.username} #token ${resp}`));
    repeatAction(() => beta_bot.sendMessage(msg.chat.id, `Your token is ${resp}\nFarewell`));
    // beta_bot.sendMessage(, `@${user.username} #token ${resp}`);
    waitForToken[userId] = NaN;
  }
});
