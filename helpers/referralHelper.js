const Wallet = require('../models/walletSchema')
const Transaction = require('../models/transactionSchema')
const userCollection = require('../models/userSchema')
const ObjectId = require('mongoose').Types.ObjectId;


  const generateReferralCode = (length) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    code += 'Jhaan-';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      code += charset[randomIndex];
    }
    code += '-jhariya';
    console.log('Generated Referral Code:', code);
    return code;
  };

// credit for refered user
const creditforRefferedUser = async (code) => {
  const findUser = await userCollection.findOne({ referralCode: code })
  if (!findUser) return false

  const walletId = findUser.wallet
  const updatedWallet = await Wallet.findByIdAndUpdate(
    walletId, { $inc: { balance: 50 } })
  console.log('update wallet', updatedWallet);

  const transaction = new Transaction({
    wallet: updatedWallet._id,
    amount: 50,
    type: 'credit',
    description: 'Referral cashback',
  });
  const transactionDone = await transaction.save();
  await Wallet.findByIdAndUpdate(walletId,
    { $push: { transactions: transactionDone._id } })

  return true
}

// credit for new user
const creditforNewUser = async (user) => {
  const updatedWallet = await Wallet.findByIdAndUpdate(
    user.wallet, { $inc: { balance: 50 } })
  const transaction = new Transaction({
    wallet: user.wallet,
    amount: 50,
    type: 'credit',
    description: ' New User referral cashback',
  });
  const transactionDone = await transaction.save();
  await Wallet.findByIdAndUpdate(user.wallet,
    { $push: { transactions: transactionDone._id } })
  console.log('updated wallet', updatedWallet);
}

module.exports = {
  generateReferralCode,
  creditforRefferedUser,
  creditforNewUser
}  