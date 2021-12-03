'use strict';

const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const alfa_token = '5081789260:AAGTTBOUi4xPsqrsFWpVvdJSGURcFbsmOE4';
const beta_token = '5029291032:AAFAfquSVFnEjDKTWGsLWxXPJG2KkkJ3QQY';

const day_f_chat_id = -1001651566770;
const tokens_chat_id = -1001733712953;

const msgA = "Це повідомлення А";

const alfa_login = "спец код альфи";
const alfa_msgB = "повідомлення Б від альфи";
const alfa_password = "пароль альфи";
const alfa_msgC = "повідомлення В альфи";

const beta_login = "спец код бети";
const beta_msgB = "повідомлення Б від бети";
const beta_password = "пароль бети";
const beta_msgC = "повідомлення В бети";

// Create a bot that uses 'polling' to fetch new updates
const alfa_bot = new TelegramBot(alfa_token, {polling: true});
const beta_bot = new TelegramBot(beta_token, {polling: true});

const userMsgRemoveTime = 3000;
const repeatMsgTime = 45000;

function recursiveSender(bot, message, callback) {
  const msg = bot.sendMessage(day_f_chat_id, message);
  msg.then(res => {
    setTimeout(() => {
      bot.deleteMessage(day_f_chat_id, res.message_id);
      setTimeout(() => callback(bot, message, callback), repeatMsgTime)
    }, repeatMsgTime);
  })
}

const beforeLoginState = 0;
const afterLoginState = 1;
const wrongPasswordState = 2;
const correctPasswordState = 3;

const temproraryUnlistenedUsers = [];

function onMessage(bot, msgB, loginSpecCode, password, msgC, callback, othercallback) {
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
      
      switch (userState[senderId]) {
        case afterLoginState:
          if (temproraryUnlistenedUsers[senderId])
            break;
          
          if (msg.text == password) {
            userState[senderId] = correctPasswordState;
            bot.sendMessage(tokens_chat_id, `@${msg.from.username} #password`).catch(() => { })
            othercallback(msg.from);
            bot.sendMessage(chatId, msgC);
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
          if (msg.text == loginSpecCode) {
            userState[senderId] = afterLoginState;
            bot.sendMessage(chatId, msgB);
            bot.sendMessage(tokens_chat_id, `@${msg.from.username} #login`).catch(() => { })
          } else { 
            bot.sendMessage(chatId, msgA);
          }
          break;
      }
    });
  }
}

recursiveSender(alfa_bot, "this is alpha bot", recursiveSender)
setTimeout(() => recursiveSender(beta_bot, "this is beta bot", recursiveSender), repeatMsgTime);
// regular_sender_clojure(beta_bot)("this is beta bot")
// regular_sender_clojure(alfa_bot)("this is alpha bot")

const waitForToken = [];

onMessage(alfa_bot, alfa_msgB, alfa_login, alfa_password, alfa_msgC, function (chatId, msgId) {
  if (chatId !== day_f_chat_id)
    return;
  // console.log(msgId)
  setTimeout(() => {
    alfa_bot.deleteMessage(chatId, msgId);
  }, userMsgRemoveTime)
}, () => { })()
onMessage(beta_bot, beta_msgB, beta_login, beta_password, beta_msgC, (chatId, msgId) => { }, (user) => {
  waitForToken[user.id] = user;
  beta_bot.banChatMember(day_f_chat_id, user.id).then(res => {
    // console.log(res)
    beta_bot.unbanChatMember(day_f_chat_id, user.id);
  }).catch((err) => {
    console.log("trying to remove admin");
  })
})();

beta_bot.onText(/\/sendcontact (.+)/, (msg, match) => {
  const userId = msg.from.id;
  const resp = match[1]; // the captured "whatever"

  const user = waitForToken[userId];
  if (user) {
    beta_bot.sendMessage(tokens_chat_id, `@${user.username} #token ${resp}`);
    waitForToken[userId] = NaN;
  }
});
