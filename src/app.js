import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import watch from './view.js';
import parse from './parser.js';

export default (i18n) => {
  const state = {
    form: {
      processState: 'filling',
      field: {
        input: '',
      },
      valid: false,
      error: null,
    },
    feeds: [],
    posts: [],
    modalWindowPostId: null,
    watchedPosts: new Set(),
  };

  yup.setLocale({
    string: {
      required: 'feedback.fieldRequired',
      url: 'feedback.urlNotValid',
    },
  });
  const initializeSchema = (feedLinks) => {
    const initializedSchema = yup.object().shape({
      input: yup.string().required().url().notOneOf(feedLinks, 'feedback.alreadyExists'),
    });
    return initializedSchema;
  };

  const validate = (fields, schema) => {
    try {
      schema.validateSync(fields, { abortEarly: false });
      return null;
    } catch (e) {
      return e.message;
    }
  };
  const proxifyUrl = (url) => new URL(`https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${url}`);

  const form = document.querySelector('form');
  const formField = document.querySelector('.form-control');

  const submitButton = document.querySelector('[type="submit"]');
  const modalForm = document.querySelector('#modal');

  const watchedState = watch(state, i18n, formField, submitButton, modalForm);

  const updateValidationState = (schema) => {
    const error = validate(watchedState.form.field, schema);
    if (error) {
      watchedState.form.error = error;
      watchedState.form.valid = false;
    } else {
      watchedState.form.error = null;
      watchedState.form.valid = true;
    }
  };

  const addIds = (posts, feedId) => {
    posts.forEach((post) => {
      post.feedId = feedId;
      post.id = _.uniqueId();
    });
  };

  const checkFeedsForUpdates = () => {
    const { feeds } = state;
    const promises = feeds.map((feed) => {
      const feedId = feed.id;
      const feedLink = proxifyUrl(feed.link);
      return axios.get(feedLink)
        .then((response) => {
          const content = response.data.contents;
          const feedData = parse(content);
          const updatedPosts = feedData.posts;
          const currentPosts = state.posts.filter((post) => post.feedId === feedId);
          const newPosts = _.differenceBy(updatedPosts, currentPosts, 'title');
          addIds(newPosts, feedId);
          if (newPosts.length > 0) {
            watchedState.posts = _.concat(newPosts, watchedState.posts);
          }
        });
    });
    const promise = Promise.all(promises);
    return promise.finally(() => setTimeout(checkFeedsForUpdates, 5000));
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const input = formData.get('url');
    watchedState.form.field.input = input;
    const feedLinks = state.feeds.map((feed) => feed.link);
    const schema = initializeSchema(feedLinks);
    updateValidationState(schema);
    if (watchedState.form.valid) {
      watchedState.form.processState = 'sending';
      const url = proxifyUrl(input);
      axios.get(url)
        .then((response) => {
          const content = response.data.contents;
          const feedData = parse(content);
          const feedLink = watchedState.form.field.input;
          const { title } = feedData;
          const { description } = feedData;
          const newFeed = {
            link: feedLink,
            title,
            description,
            id: _.uniqueId(),
          };
          const feedId = newFeed.id;
          watchedState.feeds = _.concat(newFeed, watchedState.feeds);
          const newPosts = feedData.posts;
          addIds(newPosts, feedId);
          watchedState.posts = _.concat(newPosts, watchedState.posts);
          watchedState.form.processState = 'finished';
          form.reset();
        })
        .catch((err) => {
          console.log(err);
          if (err.isAxiosError) {
            watchedState.form.error = 'feedback.networkError';
          }
          if (err.isParsingError) {
            watchedState.form.error = 'feedback.rssParsingError';
          }
          watchedState.form.processState = 'failed';
          watchedState.form.valid = false;
        });
    }
    checkFeedsForUpdates();
  });
};
