import { later, run } from '@ember/runloop';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
var attr = Ember.attr;

module("Ember.EmbeddedHasManyArray - embedded objects saving");

test("derp", function(assert) {
  var json = {
    id: 1,
    title: 'foo',
    comments: [
      {id: 1, text: 'uno'},
      {id: 2, text: 'dos'},
      {id: 3, text: 'tres'}
    ]
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });

  var Article = Ember.Model.extend({
    title: attr(),

    comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
  });

  Comment.adapter = {

    createRecord: function(record) {
      return new EmberPromise(function(resolve, reject) {
        later(function() {
          record.load(4, {text: 'quattro'});
          record.didCreateRecord();
          resolve(record);
        }, 1);
      });
    },

    saveRecord: function(record) {
      return new EmberPromise(function(resolve, reject) {
        later(function() {
          record.didSaveRecord();
          resolve(record);
        }, 1);
      });
    }
  };

  var article = Article.create();
  run(article, article.load, json.id, json);

  var comments = article.get('comments');
  var newComment = run(comments, comments.create, {text: 'quattro'});

  assert.equal(comments.get('length'), 4);
  assert.ok(newComment instanceof Comment);
  assert.deepEqual(run(comments, comments.mapBy, 'text'), ['uno', 'dos', 'tres', 'quattro']);

  run(function() {
    let done = assert.async();
    comments.save().then(function(record) {
      done();
      assert.ok(!newComment.get('isDirty'), "New comment is not dirty");
      assert.equal(newComment.get('id'), 4, "New comment has an ID");
    });
  });
});

test("new records should remain after parent is saved", function(assert) {
  assert.expect(3);
  var json = {
    id: 1,
    title: 'foo',
    comments: []
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });
  Comment.adapter = Ember.RESTAdapter.create();
  Comment.url = '/comments';

  var Article = Ember.Model.extend({
    title: attr(),
    comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
  });
  Article.adapter = Ember.RESTAdapter.create();
  Article.url = '/articles';
  Article.adapter._ajax = function() {
    return new EmberPromise(function(resolve) {
      resolve(json);
    });
  };

  var article = Article.create({
    title: 'foo'
  });

  var comment = Comment.create({
    text: 'comment text'
  });
  article.get('comments').addObject(comment);
  var promise = run(article, article.save);
  promise.then(function(record) {
    done();
    assert.ok(record.get('comments.firstObject') === comment, "Comment is the same object");
    assert.equal(record.get('comments.length'), 1, "Article should still have one comment after save");
    assert.equal(record.get('comments.firstObject.text'), comment.get('text'), 'Comment is the same');
  });
  let done = assert.async();
});
