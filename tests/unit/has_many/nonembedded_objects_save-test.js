import { run } from '@ember/runloop';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
var attr = Ember.attr;

module("Ember.HasManyArray - non embedded objects saving");

test("new records should remain after parent is saved", function(assert) {
  assert.expect(3);
  var json = {
    id: 1,
    title: 'foo',
    comment_ids: []
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });
  Comment.adapter = Ember.RESTAdapter.create();
  Comment.url = '/comments';

  var Article = Ember.Model.extend({
    id: attr(),
    title: attr(),
    comments: Ember.hasMany(Comment, { key: 'comment_ids' })
  });
  Article.adapter = Ember.RESTAdapter.create();
  Article.url = '/articles';
  Article.adapter._ajax = function() {
    return new EmberPromise(function(resolve) {
        resolve(json);
    });
  };

  var article = Article.create({
    title: 'bar'
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

test("saving child objects", function(assert) {
  assert.expect(1);

  var commentJSON = {
    id: 2,
    title: 'bar',
  };

  var Comment = Ember.Model.extend({
    id: attr(),
    text: attr()
  });
  Comment.adapter = Ember.RESTAdapter.create();
  Comment.url = '/comments';
  Comment.adapter._ajax = function() {
    return new EmberPromise(function(resolve) {
        resolve(commentJSON);
    });
  };

  var Article = Ember.Model.extend({
    id: attr(),
    title: attr(),
    comments: Ember.hasMany(Comment, { key: 'comment_ids' })
  });
  Article.adapter = Ember.RESTAdapter.create();
  Article.url = '/articles';

  var article = Article.create();
  var comment = Comment.create();

  var comments = article.get("comments");
  comments.addObject(comment);

  var promise = run(comments, comments.save);
  promise.then(function(records) {
    done();
    var comment = records.get('firstObject');
    assert.equal(comment.get("id"), 2, "Data from the response is loaded");
  }).catch(function(error) {
    // eslint-disable-next-line no-console
    console.error(error);
  });
  let done = assert.async();
});
