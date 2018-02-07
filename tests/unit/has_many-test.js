import Application from '@ember/application';
import { A } from '@ember/array';
import { run } from '@ember/runloop';
import ComputedProperty from '@ember/object/computed';
import { get } from '@ember/object';
import { module, test } from 'qunit';
import expectAssertion from 'ember-model/tests/helpers/expect-assertion';

module("Ember.hasMany");

test("it exists", function(assert) {
  assert.ok(Ember.hasMany);
});

test("is a CP macro", function(assert) {
  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      cp = Ember.hasMany(Comment, { key: 'comments', embedded: true }),
      Article = Ember.Model.extend({
        comments: cp
      });

  Comment.primaryKey = 'token';

  assert.ok(cp instanceof ComputedProperty);

  var article = Article.create();
  run(article, article.load, 1, {comments: A([{token: 'a'}, {token: 'b'}])});
  var comments = run(article, article.get, 'comments');

  assert.ok(comments instanceof Ember.EmbeddedHasManyArray);
  assert.equal(comments.get('modelClass'), Comment);
  assert.equal(comments.get('parent'), article);
});

test("creates Ember.HasManyArray if embedded is set to false", function(assert) {
var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      cp = Ember.hasMany(Comment, { key: 'comments' }),
      Article = Ember.Model.extend({
        comments: cp
      });

  Comment.primaryKey = 'token';

  assert.ok(cp instanceof ComputedProperty);

  var article = Article.create();
  run(article, article.load, 1, {comments: A([1, 2])});
  var comments = run(article, article.get, 'comments');

  assert.ok(comments instanceof Ember.HasManyArray);
  assert.equal(comments.get('modelClass'), Comment);
  assert.equal(comments.get('parent'), article);
});

test("using it in a model definition", function(assert) {
  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  run(article, article.load, 1, {comments: A([{token: 'a'}, {token: 'b'}])});

  assert.equal(article.get('comments.length'), 2);
  assert.equal(run(article, article.get, 'comments.firstObject.token'), 'a');
});

test("model can be specified with a string instead of a class", function(assert) {
  var Article = Ember.Model.extend({
      comments: Ember.hasMany('Ember.CommentModel', { key: 'comments', embedded: true })
      }),
      Comment = Ember.CommentModel = Ember.Model.extend({
        token: Ember.attr(String)
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  run(article, article.load, 1, {comments: A([{token: 'a'}, {token: 'b'}])});

  assert.equal(article.get('comments.length'), 2);
  assert.equal(run(article, article.get, 'comments.firstObject.token'), 'a');
});

test("model can be specified with a string to a resolved path", function(assert) {
  var App;
  run(function() {
    App = Application.create({});
  });

  App.Subcomment = Ember.Model.extend({
    id: Ember.attr(String)
  });
  App.Comment = Ember.Model.extend({
    id: Ember.attr(String),
    subComments: Ember.hasMany('subcomment', { key: 'subcomments', embedded: true })
  });
  App.Article = Ember.Model.extend({
    comments: Ember.hasMany('comment', { key: 'comments', embedded: true })
  });

  var article = App.Article.create({container: App.__container__});
  var subcomments = {
    subcomments: A([
      {id: 'c'},
      {id: 'd'}
    ])
  };
  var comment1 = {id: 'a'};
  comment1.subcomments = subcomments;
  var comment2 = {id: 'b'};

  run(article, article.load, 1, {comments: A([comment1, comment2])});

  assert.equal(article.get('comments.length'), 2);
  assert.equal(run(article, article.get, 'comments.firstObject.id'), 'a');

  run(App, 'destroy');
});

test("when fetching an association getHasMany is called", function(assert) {
  assert.expect(4);

  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();
  article.getHasMany = function(key, type, meta) {
    assert.equal(key, 'comments', "key passed to getHasMany should be the same as key in hasMany options");
    assert.equal(type, Comment, "type of the association should be passed to getHasMany");
    assert.equal(meta.kind, 'hasMany', "metadata should be passed to getHasMany");

    return 'foobar';
  };

  run(article, article.load, 1, {comments: A([{token: 'a'}, {token: 'b'}])});

  assert.equal(article.get('comments'), 'foobar', "value returned from getHasMany should be returned as an association");
});

test("when setting an association that has been neither loaded or fetched getHasMany is called", function(assert) {
    assert.expect(4);
    var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();

  article.getHasMany = function(key, type, meta) {
    assert.equal(key, 'comments', "key passed to getHasMany should be the same as key in hasMany options");
    assert.equal(type, Comment, "type of the association should be passed to getHasMany");
    assert.equal(meta.kind, 'hasMany', "metadata should be passed to getHasMany");

    return A();
  };

  article.set('comments', A([{token: 'a'}, {token: 'b'}]));
  assert.deepEqual(article.get('comments'), [{token: 'a'}, {token: 'b'}], "setting the relation should have created and filled a hasManyArray");
});

test("when setting an association that has been loaded but not fetched getHasMany is called", function(assert) {
    assert.expect(4);
    var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comments', embedded: true })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();

  article.getHasMany = function(key, type, meta) {
    assert.equal(key, 'comments', "key passed to getHasMany should be the same as key in hasMany options");
    assert.equal(type, Comment, "type of the association should be passed to getHasMany");
    assert.equal(meta.kind, 'hasMany', "metadata should be passed to getHasMany");

    return A();
  };

  run(article, article.load, 1, {comments: A([{token: 'a'}, {token: 'b'}])});

  article.set('comments', A([{token: 'b'}, {token: 'c'}]));
  assert.deepEqual(article.get('comments'), [{token: 'b'}, {token: 'c'}], "setting the relation should have created and filled a hasManyArray");
});

test("toJSON uses the given relationship key", function(assert) {
  assert.expect(1);

  var Comment = Ember.Model.extend({
        token: Ember.attr(String)
      }),
      Article = Ember.Model.extend({
        comments: Ember.hasMany(Comment, { key: 'comment_ids' })
      });

  Comment.primaryKey = 'token';

  var article = Article.create();

  run(article, article.load, 1, { comment_ids: A(['a'] )});

  assert.deepEqual(article.toJSON(), { comment_ids: ['a'] }, "Relationship ids should be serialized only under the given key");
});

test("materializing the relationship should not dirty the record", function(assert) {
  assert.expect(2);

  var Author = Ember.Model.extend({
        id: Ember.attr()
      }),
      Post = Ember.Model.extend({
        id: Ember.attr(),
        authors: Ember.hasMany(Author, {key: 'author_ids'})
      });

  Post.adapter = Ember.FixtureAdapter.create();
  Author.adapter = Ember.FixtureAdapter.create();

  var post = run(Post, Post.create);
  post.get('id');
  assert.ok(!post.get('isDirty'), 'is not dirty before materializing the relationship');
  post.get('authors');
  assert.ok(!post.get('isDirty'), 'is not dirty after materializing the relationship');
});

test("has many records created are available from reference cache", function(assert) {


  var Company = Ember.Company = Ember.Model.extend({
     id: Ember.attr('string'),
     title: Ember.attr('string'),
     projects: Ember.hasMany('Ember.Project', {key:'projects', embedded: true})
  }),
    Project = Ember.Project = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        posts: Ember.hasMany('Ember.Post', {key: 'posts', embedded: true}),
        company: Ember.belongsTo('Ember.Company', {key:'company'})
    }),
    Post = Ember.Post = Ember.Model.extend({
        id: Ember.attr('string'),
        title: Ember.attr('string'),
        body: Ember.attr('string'),
        project: Ember.belongsTo('Ember.Project', {key:'project'})
    });

  var compJson = {
    id:1,
    title:'coolio',
    projects:[{
          id: 1,
          title: 'project one title',
          company: 1,
          posts: [{id: 1, title: 'title', body: 'body', project:1 },
                  {id: 2, title: 'title two', body: 'body two', project:1 }]
      }]
    };

  Company.load([compJson]);
  var company = Company.find(1);

  var project = company.get('projects.firstObject');
  var projectFromCacheViaFind = Project.find(project.get('id'));
  var projectRecordFromCache = Project._referenceCache[project.get('id')].record;

  assert.equal(project, projectFromCacheViaFind);
  assert.equal(project, projectRecordFromCache);

  var post = project.get('posts.firstObject');
  var postFromCache = Post.find(post.get('id'));
  assert.equal(post, postFromCache);

});

test("relationship type cannot be empty", function(assert) {
  assert.expect(1);

  var Article = Ember.Model.extend({
      comments: Ember.hasMany('', { key: 'comments' })
    }),
    Comment = Ember.CommentModel = Ember.Model.extend({
      token: Ember.attr(String)
    });

  Comment.primaryKey = 'token';

  var article = Article.create(),
     comment = Comment.create();

  var comments = [comment];
  run(article, article.load, 1, {comments: A([{token: 'a'}, {token: 'b'}])});

  expectAssertion(assert, function() {
      article.get('comments');
  },
  /Type cannot be empty/);

});

test("key defaults to model's property key", function(assert) {
  assert.expect(1);

  var Comment = Ember.Model.extend({
      id: Ember.attr()
    }),
    Article = Ember.Model.extend({
      comments: Ember.hasMany(Comment)
    });

  var article = Article.create();

  run(article, article.load, 1, { comments: A(['a'] )});

  assert.deepEqual(article.toJSON(), { comments: ['a'] });
});
