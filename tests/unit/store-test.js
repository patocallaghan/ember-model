import Route from '@ember/routing/route';
import Application from '@ember/application';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
var TestModel, EmbeddedModel, UUIDModel, store, registry, container, App;

module("Ember.Model.Store", {
  beforeEach: function() {
    registry = new Ember.Registry();
    container = registry.container();

    store = Ember.Model.Store.create({container: container});
    TestModel = Ember.Model.extend({
      token: Ember.attr(),
      name: Ember.attr(),
      type: 'test',
      embeddedBelongsTo: Ember.belongsTo('embedded', {
        key: 'embeddedBelongsTo',
        embedded: true
      }),
      embeddedHasmany: Ember.hasMany('embedded', {
        key: 'embeddedHasmany',
        embedded: true
      })
    });
    TestModel.primaryKey = 'token';
    TestModel.adapter = Ember.FixtureAdapter.create({});
    TestModel.FIXTURES = [
      {
        token: 'a',
        name: 'Erik',
        embeddedBelongsTo: {id: 1, name: 'Record 1'},
        embeddedHasmany: [
          {id: 1, name: 'Record 1'},
          {id: 2, name: 'Record 2'}
        ]
      },
      {
        token: 'b',
        name: 'Christina',
        embeddedBelongsTo: {id: 1, name: 'Record 1'},
        embeddedHasmany: [
          {id: 1, name: 'Record 1'},
          {id: 2, name: 'Record 2'}
        ]
      }
    ];

    EmbeddedModel = Ember.Model.extend({
      id: Ember.attr(),
      name: Ember.attr(),
      type: 'test'
    });
    EmbeddedModel.adapter = Ember.FixtureAdapter.create({});

    var uuid = 1234;

    UUIDModel = Ember.Model.extend({
      init: function() {
        this.set('id', uuid++);
        return this._super.apply(this, arguments);
      },
      token: Ember.attr(),
      name: Ember.attr()
    });
    EmbeddedModel.adapter = Ember.FixtureAdapter.create({});

    registry.register('model:test', TestModel);
    registry.register('model:embedded', EmbeddedModel);
    registry.register('model:uuid', UUIDModel);
    registry.register('store:main', Ember.Model.Store);
  }
});

test("store.createRecord(type) returns a record with a container", function(assert) {
  var record = run(store, store.createRecord, 'test');
  assert.equal(record.container, container);
  assert.equal(record.container, container);
});

test("store.createRecord(type) with properties", function(assert) {
  assert.expect(2);
  var record = run(store, store.createRecord, 'test', {token: 'c', name: 'Andrew'});
  assert.equal(record.get('token'), 'c');
  assert.equal(record.get('name'), 'Andrew');
});

test("model.load(hashes) returns a existing record with correct container", function(assert) {
  var model = store.modelFor('uuid'),
      record = run(store, store.createRecord, 'uuid');

  assert.equal(model, UUIDModel);
  assert.equal(record.container, container);

  assert.ok(record.set('token', 'c'));

  assert.equal(record.get('id'), 1234);
  assert.equal(record.get('token'), 'c');

  model.load({id: 1234, token: 'd', name: 'Andrew'});

  assert.equal(record.get('id'), 1234);
  assert.equal(record.get('token'), 'd');
  assert.equal(record.get('name'), 'Andrew');
  assert.equal(record.get('container'), container);

  model.load({id: 1234, name: 'Peter'}, container);

  assert.equal(record.get('id'), 1234);
  assert.equal(record.get('token'), undefined);
  assert.equal(record.get('name'), 'Peter');
  assert.equal(record.get('container'), container);
});

test("store.find(type) returns a record with hasMany and belongsTo that should all have a container", function(assert) {
  assert.expect(4);
  var promise = run(store, store.find, 'test', 'a');
  var done = assert.async();
  promise.then(function(record) {
    done();
    assert.ok(record.get('container'));
    assert.ok(record.get('embeddedBelongsTo').get('container'));

    record.get('embeddedHasmany').forEach(function(embeddedBelongsToRecord) {
      assert.ok(embeddedBelongsToRecord.get('container'));
    });
  });
});

test("store.find(type, id) returns a promise and loads a container for the record", function(assert) {
  assert.expect(2);

  var promise = run(store, store.find, 'test','a');
  promise.then(function(record) {
    done();
    assert.ok(record.get('isLoaded'));
    assert.ok(record.get('container'));
  });
  let done = assert.async();
});

test("store.find(type) returns a promise and loads a container for each record", function(assert) {
  assert.expect(5);

  var promise = run(store, store.find, 'test');
  promise.then(function(records) {
    done();
    assert.equal(records.content.length, 2);
    records.forEach(function(record){
      assert.ok(record.get('isLoaded'));
      assert.ok(record.get('container'));
    });
  });
  let done = assert.async();
});

test("store.find(type, Array) returns a promise and loads a container for each record", function(assert) {
  assert.expect(5);

  var promise = run(store, store.find, 'test', ['a','b']);
  promise.then(function(records) {
    done();
    assert.equal(records.content.length, 2);
    records.forEach(function(record){
      assert.ok(record.get('isLoaded'));
      assert.ok(record.get('container'));
    });
  });
  let done = assert.async();
});

test("store.adapterFor(type) returns klass.adapter first", function(assert) {
  var adapter = run(store, store.adapterFor, 'test');
  assert.equal(adapter.constructor, Ember.FixtureAdapter);
});

test("store.adapterFor(type) returns type adapter if no klass.adapter", function(assert) {
  TestModel.adapter = undefined;
  registry.register('adapter:test', Ember.FixtureAdapter);
  registry.register('adapter:application', null);
  var adapter = run(store, store.adapterFor, 'test');
  assert.ok(adapter instanceof Ember.FixtureAdapter);
});

test("store.adapterFor(type) returns application adapter if no klass.adapter or type adapter", function(assert) {
  TestModel.adapter = undefined;
  registry.register('adapter:test', null);
  registry.register('adapter:application', Ember.FixtureAdapter);
  var adapter = run(store, store.adapterFor, 'test');
  assert.ok(adapter instanceof Ember.FixtureAdapter);
});

test("store.adapterFor(type) defaults to RESTAdapter if no adapter specified", function(assert) {

  TestModel.adapter = undefined;
  registry.register('adapter:test', null);
  registry.register('adapter:application', null);
  registry.register('adapter:REST',  Ember.RESTAdapter);
  var adapter = run(store, store.adapterFor, 'test');
  assert.ok(adapter instanceof Ember.RESTAdapter);
});

test("store.find(type) records use application adapter if no klass.adapter or type adapter", function(assert) {
  assert.expect(3);
  TestModel.adapter = undefined;
  EmbeddedModel.adapter = undefined;
  registry.register('adapter:test', null);
  registry.register('adapter:application', Ember.FixtureAdapter);

  var promise = run(store, store.find, 'test','a');

  promise.then(function(record) {
    done();
    assert.ok(record.get('constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for record is application adapter');
    assert.ok(record.get('embeddedBelongsTo.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for belongsTo record is application adapter');
    assert.ok(record.get('embeddedHasmany.firstObject.constructor.adapter') instanceof Ember.FixtureAdapter, 'Adapter for hasMany record is application adapter');
  });

  let done = assert.async();
});

test("Registering a custom store on application works", function(assert) {
  run(function() {
    var CustomStore = Ember.Model.Store.extend({ custom: true });
    App = Application.create({
      TestRoute: Route.extend(),
      Store: CustomStore
    });
  });

  container = App.__container__;
  assert.ok(container.lookup('store:application'));
  assert.ok(container.lookup('store:main').get('custom'));

  var testRoute = container.lookup('route:test');
  assert.ok(testRoute.get('store.custom'));

  run(App, 'destroy');
});
