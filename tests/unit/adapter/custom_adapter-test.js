import { run } from '@ember/runloop';
import { module, test } from 'qunit';
var CustomModel;

module("Ember.CustomAdapter", {
  beforeEach: function() {
    Ember.CustomAdapter = Ember.Adapter.extend();
    CustomModel = Ember.Model.extend({
      name: Ember.attr()
    });
    CustomModel.adapter = Ember.CustomAdapter.create();
  }
});

test("throws an error message with class name", function(assert) {
  assert.expect(1);

  assert.throws(function() {
    run(CustomModel, CustomModel.find(1));
  }, /Ember.CustomAdapter must implement find/);
});