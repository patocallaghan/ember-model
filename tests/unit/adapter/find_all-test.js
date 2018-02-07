import { resolve, reject } from 'rsvp';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
module("Ember.Adapter#findAll");

test("Model.find() delegates to Adapter#findAll", function(assert) {
  assert.expect(7);

  var Model = Ember.Model.extend({
    name: Ember.attr()
  });
  Model.adapter = Ember.FixtureAdapter.create();
  Model.FIXTURES = [
    {id: 1, name: 'Erik'}
  ];

  var records = run(Model, Model.find);
  assert.ok(records instanceof Ember.RecordArray, "RecordArray is returned");
  assert.ok(!records.get('isLoaded'));
  assert.ok(records.get('isLoading'));
  let done = assert.async();

  records.on('didLoad', function() {
    done();
    // equal(records.get('firstObject.id'), 1); // TODO: built-in CP for primaryKey
    assert.equal(records.get('firstObject.name'), 'Erik');
    assert.ok(records.get('firstObject.isLoaded'));
    assert.ok(records.get('isLoaded'));
    assert.ok(!records.get('isLoading'));
  });
});

test("Model.find() returns the same RecordArray for each successful call", function(assert) {
  var Model = Ember.Model.extend();
  Model.adapter = {
    findAll: resolve
  };

  var firstResult = Model.find();
  var secondResult = Model.find();

  assert.equal(firstResult, secondResult, "The same RecordArray was returned");
});

test("Model.find() returns a new RecordArray if the last call failed", function(assert) {
  var Model = Ember.Model.extend();
  Model.adapter = {
    findAll: reject
  };

  var firstResult, secondResult;
  run(function() {
    firstResult = Model.find();
  });
  secondResult = Model.find();

  assert.notEqual(firstResult, secondResult, "A new RecordArray was returned");
});
