import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { _ } from 'meteor/underscore';
import { debugAssert } from '/imports/utils/assert.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import { Breakdowns } from '/imports/api/transactions/breakdowns/breakdowns.js';
import { ChartOfAccounts } from '/imports/api/transactions/breakdowns/chart-of-accounts.js';
import { Localizer } from '/imports/api/transactions/breakdowns/localizer.js';

export const Balances = new Mongo.Collection('balances');

Balances.schema = new SimpleSchema([{
  communityId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  //phase: { type: String, defaultValue: 'done', allowedValues: ['real', 'plan'] },
  account: { type: String },
  localizer: { type: String, optional: true },
  tag: { type: String },  // can be a period, end of a period, or a period closing tag
  amount: { type: Number, optional: true },
}]);

Meteor.startup(function indexBalances() {
  Balances.ensureIndex({ communityId: 1, account: 1, localizer: 1, tag: 1 });
});

Balances.attachSchema(Balances.schema);

Balances.get = function get(def) {
  Balances.schema.validate(def);

  const coa = ChartOfAccounts.get(def.communityId);
  const leafs = coa.leafsOf(def.account);
  if (def.localizer) {
    const loc = Localizer.get(def.communityId);
    const locNode = loc.nodeByCode(def.localizer);
    debugAssert(locNode.isLeaf); // Currently not prepared for upward cascading localizer
    // If you want to know the balance of a whole floor or building, the transaction update has to trace the localizer's parents too
  }
  let result = 0;
  leafs.forEach(leaf => {
    const balance = Balances.findOne({
      communityId: def.communityId,
      account: leaf.code,
      localizer: def.localizer,
      tag: def.tag,
    });
    result += balance ? balance.amount : 0;
  });
  return result;
};

function timeTagMatches(valueDate, tag) {
  return tag === 'T'; // TODO: support other tags as well
}

Balances.checkCorrect = function checkCorrect(def) {
  if (Meteor.isClient) return; // No complete tx data on the client to perform a check.
  if (def.tag !== 'T' || def.localizer) return; // TODO: support other tags / localizer as well
  const txs = Transactions.find({ communityId: def.communityId, $or: [{ 'debit.account': def.account }, { 'credit.account': def.account }] });
  let entryCount = 0;
  let calculatedBalance = 0;
  txs.forEach((tx) => {
    tx.journalEntries().forEach((entry) => {
      if (entry.account === def.account && timeTagMatches(entry.valueDate, def.tag)) {
        entryCount += 1;
        calculatedBalance += entry.effectiveAmount();
      }
    });
  });
  const dbBalance = Balances.get(def);
  if (dbBalance !== calculatedBalance) {
    console.log('Balance inconsistency ERROR',
      `Calculated balance of '${def} is ${calculatedBalance} (from ${entryCount} entries)\nDb balance of same account: ${dbBalance}`
    );
    console.log(txs.fetch());
  }
};

Balances.checkAllCorrect = function checkAllCorrect() {
  if (Meteor.isClient) return; // No complete tx data on the client to perform check.
  Balances.find({ tag: 'T' }).forEach((bal) => {
    delete bal._id;
    Balances.checkCorrect(bal);
  });
};
