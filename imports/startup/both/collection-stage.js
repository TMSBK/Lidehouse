import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';

// The stage is a non-indexed temporary decorator for collection operations,
// which ops can later (after some checks) be commit-ed to the real collection or simply discard-ed.
function CollectionStage(collection) {
  this._collection = collection;
  this._fresh = new Mongo.Collection(null);
  this._fresh._transform = collection._transform;
  this._trash = []; // ids only
  this._operations = [];
  // some of the api needs to be copied over
  this._name = collection._name + '_stage';
  this.idSet = collection.idSet;
}

// Must be able to call findActive and other static helpers on the Stage
CollectionStage.prototype = Object.create(Mongo.Collection.prototype);
CollectionStage.prototype.constructor = CollectionStage;

// But the standard Collection API needs to be overriden
CollectionStage.prototype.find = function find(selector, options) {
//    console.log('find', this._toString());
//    console.log('selector', selector);
  const freshResult = this._fresh.find(selector, options).fetch();
  let collectionResult = this._collection.find(selector, options).fetch();
//    console.log('freshResult', freshResult);
//    console.log('collectionResult', collectionResult);
  //  if the stage has a version of it, that is overriding the collection version
  freshResult.forEach(sdoc => {
    collectionResult = _.reject(collectionResult, doc => doc._id === sdoc._id);
  });
  let results = freshResult.concat(collectionResult);
  // find should return only docs that are not in the trash,
  results = _.reject(results, doc => _.contains(this._trash, doc._id));
//    console.log('results', results);
  return results;
};

CollectionStage.prototype.findOne = function findOne(selector, options) {
  return this.find(selector)[0];
};

CollectionStage.prototype.insert = function insert(doc) {
  const _id = this._fresh.insert(doc);
  this._operations.push({ operation: this._collection.insert, params: [_.extend(doc, { _id })] });
//    console.log('insert', this._toString());
  return _id;
};

CollectionStage.prototype.update = function update(selector, modifier, options) {
  const collectionVersions = this._collection.find(selector);
  collectionVersions.forEach(doc => {
    if (!this._fresh.findOne(doc._id)) this._fresh.insert(doc);
  });
  const freshResult = this._fresh.update(selector, modifier, options);

  this._operations.push({ operation: this._collection.update, params: [selector, modifier, options] });
//    console.log('update', this._toString());
  return freshResult;
};

CollectionStage.prototype.remove = function remove(selector) {
  const toRemoveIds = this.find(selector).map(doc => doc._id);
  this._trash = this._trash.concat(toRemoveIds);
  this._operations.push({ operation: this._collection.remove, params: [selector] });
//    console.log('remove', this._toString());
  return toRemoveIds.length;
};

CollectionStage.prototype._clear = function _clear() {
  this._fresh.remove({});
  this._trash = [];
  this._operations = [];
};

CollectionStage.prototype.commit = function commit() {
  this._operations.forEach(op => {
//      console.log("Applying", op.operation.name, op.params);
    const ret = op.operation.apply(this._collection, op.params);
//      console.log("ret", ret);
  });
  this._clear();
};

CollectionStage.prototype.discard = function discard() {
  this._clear();
};

CollectionStage.prototype._toString = function _toString() {
  return 'collection: ' + this._collection._name + '\n'
    + 'fresh: ' + JSON.stringify(this._fresh.find({}).fetch()) + '\n'
    + 'trash: ' + JSON.stringify(this._trash) + '\n'
    + 'operations: ' + JSON.stringify(this._operations) + '\n';
};

Mongo.Collection.prototype.Stage = function Stage() {
//  if (!this._stage) this._stage = new CollectionStage(this); 
//  return this._stage;
  return new CollectionStage(this);
};
