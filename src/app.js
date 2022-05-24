import axios from 'axios';
import _ from 'lodash';
import validate from './validate.js';
import { createWatchedState, handleProcessState } from './render.js';
import parse from './parser.js';

export default (i18n) => {
  const elements = {
    form: document.querySelector('form'),
    RSSinput: document.getElementById('url-input'),
    submitBtn: document.querySelector('button[type = "submit"]'),
    feedbackEl: document.querySelector('p.feedback'),
    RSSfeedsEl: document.querySelector('div.feeds'),
    RSSpostsEl: document.querySelector('div.posts'),
  };

  const state = {
    form: {
      validation: {
        error: '',
      },
      process: {
        state: '',
        error: '',
      },
    },
    loadedRSSfeeds: {
      feeds: [], // { id: uniqueId(), URL: '', title: '', description: '' }
      posts: [], // { feedId: '', URL: '', title: '', description: '' }
    },
    UIstate: {
      readedPostsURLs: [],
    },
  };

  const watchedState = createWatchedState(state, elements, i18n);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const enteredURL = data.get('url');

    const loadedFeedsUrls = watchedState.loadedRSSfeeds.feeds.map((feed) => feed.URL);

    const errors = validate(enteredURL, loadedFeedsUrls);
    errors
      .then((errs) => {
        watchedState.form.validation.error = errs.join(', ');
      })

      .then(() => {
        if (watchedState.form.validation.error.length === 0) {
          watchedState.form.process.state = 'loading';
          watchedState.form.process.error = '';

          axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(enteredURL)}`)

            .then((response) => {
              const { parsedFeed, parsedPosts } = parse(response);

              const feed = {
                id: _.uniqueId(),
                URL: enteredURL,
                title: parsedFeed.title,
                description: parsedFeed.description,
              };
              watchedState.loadedRSSfeeds.feeds.push(feed);

              parsedPosts.forEach((parsedPost) => {
                const post = {
                  feedId: feed.id,
                  URL: parsedPost.URL,
                  title: parsedPost.title,
                  description: parsedPost.description,
                };
                watchedState.loadedRSSfeeds.posts.push(post);
              });
              watchedState.form.process.state = 'loaded';

              setTimeout(function updatePosts() {
                const feedsURLs = _.map(watchedState.loadedRSSfeeds.feeds, 'URL');

                feedsURLs.forEach((feedURL) => {
                  axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(feedURL)}`)

                    .then((responseTimer) => {
                      const parsedPostsTimer = parse(responseTimer).parsedPosts;

                      parsedPostsTimer.forEach((parsedPostTimer) => {
                        const newParsedPostURL = parsedPostTimer.URL;

                        if (_.find(watchedState.loadedRSSfeeds.posts, ['URL', newParsedPostURL])) {
                          return;
                        }

                        const newPost = {
                          feedId: feed.id,
                          URL: newParsedPostURL,
                          title: parsedPostTimer.title,
                          description: parsedPostTimer.description,
                        };

                        watchedState.loadedRSSfeeds.posts.push(newPost);
                        handleProcessState(elements, watchedState, i18n);
                      });
                    });
                });

                setTimeout(updatePosts, 5000);
              }, 5000);
            })

            .catch((error) => {
              if (error.response || error.request) {
                watchedState.form.process.error = 'feedbackMsg.processState.networkError';
              } else {
                watchedState.form.process.error = 'feedbackMsg.processState.notValid';
              }
              watchedState.form.process.state = 'failed';
            });
        }
      });
  });
};
